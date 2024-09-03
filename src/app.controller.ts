import { FilterQuery, Schema } from 'mongoose';
import {
  Controller,
  Body,
  HttpStatus,
  InternalServerErrorException,
  Query,
  Res,
  Logger,
  Req,
  Param,
  NotFoundException,
  ConflictException,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ApiTags } from '@nestjs/swagger';
import moment from 'moment-timezone';

import { Response, Request } from 'express';
import { MessagePattern } from '@nestjs/microservices';
import { isActiveinActive } from 'utils/active';
import {
  searchableAttributes,
  sortableAttributes,
  searchableIds,
  VehiclesResponse,
  VehiclesRequest,
} from './models';
import { AppService } from './app.service';
import { EditVehiclesRequest } from './models/editRequest.model';

import AddDecorators from './decorators/add';
import DeleteDecorators from './decorators/delete';
import GetByIdDecorators from './decorators/getById';
import UpdateByIdDecorators from './decorators/updateById';
import GetDecorators from './decorators/get';
import GetDefaultDecorators from './decorators/getDefault';

import IsActiveDecorators from './decorators/isActive';
import { IsActive } from './models/isActive.model';
import { vehicleById } from './shared/vehicleById';
import {
  ListingParams,
  MongoIdValidationPipe,
  MessagePatternResponseInterceptor,
  BaseController,
  ListingParamsValidationPipe,
  AwsService,
} from '@shafiqrathore/logeld-tenantbackend-common-future';
import { addAndUpdate } from './shared/addUpdate.validator';
import VehicleDocument from 'mongoDb/document/document';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { uploadDocument } from 'shared/documentUpload';
import UpdateVINByIdDecorators from 'decorators/updateVINById';

@Controller('vehicles')
@ApiTags('Vehicles')
export class AppController extends BaseController {
  constructor(
    private readonly vehicleService: AppService,
    private readonly awsService: AwsService,
  ) {
    super();
  }

  @UseInterceptors(new MessagePatternResponseInterceptor())
  @MessagePattern({ cmd: 'get_vehicle_by_id' })
  async tcp_getVehicleById(
    vehicleId: string,
  ): Promise<VehiclesResponse | Error> {
    let vehicle;
    let exception;

    try {
      vehicle = await this.vehicleService.findVehicleById(vehicleId, {
        isActive: true,
      });
      if (!vehicle) {
        throw new NotFoundException('Vehicle not found');
      }
      vehicle = new VehiclesResponse(vehicle);
    } catch (error) {
      exception = error;
    }

    return vehicle ?? exception;
  }

  @UseInterceptors(new MessagePatternResponseInterceptor())
  @MessagePattern({ cmd: 'get_vehicle_by_vin' })
  async tcp_getVehicleByVin(vinNo: string): Promise<VehiclesResponse | Error> {
    let vehicle;
    let exception;

    try {
      vehicle = await this.vehicleService.findVehicleByVin(vinNo, {
        isActive: true,
      });
      if (!vehicle) {
        throw new NotFoundException('Vehicle not found');
      }
      vehicle = new VehiclesResponse(vehicle);
    } catch (error) {
      exception = error;
    }

    return vehicle ?? exception;
  }

  @UseInterceptors(new MessagePatternResponseInterceptor())
  @MessagePattern({ cmd: 'get_all_vehicle' })
  async tcp_getAllVehicle(): Promise<VehiclesResponse | Error> {
    let vehicles;
    let exception;
    const vehicleList: VehiclesResponse[] = [];

    try {
      const options: FilterQuery<VehicleDocument> = {};
      vehicles = await this.vehicleService.find(options);
      if (!vehicles) {
        throw new NotFoundException('Vehicle not found');
      }

      for (const vehicle of vehicles) {
        vehicleList.push(new VehiclesResponse(vehicle));
      }
    } catch (error) {
      exception = error;
    }

    return vehicleList ?? exception;
  }

  @UseInterceptors(new MessagePatternResponseInterceptor())
  @MessagePattern({ cmd: 'get_all_assigned_devices' })
  async tcp_getAllAssignedDevices(key: string): Promise<any> {
    try {
      let options: FilterQuery<VehicleDocument>;
      if (key == 'eldId') {
        options = { [key]: { $ne: null }, _id: { $ne: null } };
      }
      const assign = await this.vehicleService.findAssigned(options, key);
      if (assign && assign.length > 0) {
        return assign.map(function (item) {
          return item[key];
        });
      } else {
        return assign;
      }
    } catch (exception) {
      return exception;
    }
  }
  //
  @UseInterceptors(new MessagePatternResponseInterceptor())
  @MessagePattern({ cmd: 'assign_driverId_to_vehicle' })
  async tcp_assignDriverIdToVehicle(params) {
    const response = await this.vehicleService.addDriverToAssignedVehicle(
      params.vehicle,
      params.driver,
    );
    return response;
  }
  //

  @UseInterceptors(new MessagePatternResponseInterceptor())
  @MessagePattern({ cmd: 'update_eldId_in_vehicle' })
  async tcp_updateEldIdInVehicle(params: any) {
    const response = await this.vehicleService.updateEldIdInVehicle(
      params.vehicleId,
      params.tenantId,
      params.eldId,
      params.deviceName,
    );
    return response;
  }
  @GetDefaultDecorators()
  async getDefaultVehicles(
    @Query(new ListingParamsValidationPipe()) queryParams: ListingParams,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    try {
      const options: FilterQuery<VehicleDocument> = {};

      const { search, orderBy, orderType, limit, showUnAssigned } = queryParams;
      let { pageNo } = queryParams;
      const { tenantId: id, timeZone } =
        request.user ?? ({ tenantId: undefined } as any);

      let isActive = queryParams.isActive;
      const arr = [];
      arr.push(isActive);
      if (arr.includes('true')) {
        isActive = true;
      } else {
        isActive = false;
      }

      if (search) {
        options['$or'] = [];

        if (Types.ObjectId.isValid(search)) {
          searchableIds.forEach((attribute) => {
            options['$or'].push({ [attribute]: new RegExp(search, 'i') });
          });
        }
        searchableAttributes.forEach((attribute) => {
          options['$or'].push({ [attribute]: new RegExp(search, 'i') });
        });
        if (arr[0]) {
          options['$and'] = [];
          isActiveinActive.forEach((attribute) => {
            options['$and'].push({ [attribute]: isActive });
          });
        }
      } else {
        if (arr[0]) {
          options['$or'] = [];

          isActiveinActive.forEach((attribute) => {
            options['$or'].push({ [attribute]: isActive });
          });
        }
      }
      if (options.hasOwnProperty('$and')) {
        options['$and'].push({ tenantId: id });
      } else {
        options['$and'] = [{ tenantId: id }];
      }
      if (showUnAssigned) {
        const assignedVehicle = await this.vehicleService.getAssignedVehicles(
          'vehicleId',
        );
        Object.assign(options, { _id: { $nin: assignedVehicle } });
      }
      const query = this.vehicleService.find(options);

      if (orderBy && sortableAttributes.includes(orderBy)) {
        query.collation({ locale: 'en' }).sort({ [orderBy]: orderType ?? 1 });
      } else {
        query.sort({ createdAt: 1 });
      }

      const total = await this.vehicleService.count(options);

      let queryResponse;
      if (!limit || !isNaN(limit)) {
        query.skip(((pageNo ?? 1) - 1) * (limit ?? 10)).limit(limit ?? 10);
      }
      queryResponse = await query.exec();

      const vehicleList: VehiclesResponse[] = [];

      for (const vehicle of queryResponse) {
        const jsonVehicle = vehicle.toJSON();

        let driverName = '';
        if (jsonVehicle.assignedDrivers.length > 0) {
          // Extracting driver id to populate driver details - START
          // const driverId =
          //   jsonVehicle.assignedDrivers[jsonVehicle.assignedDrivers.length - 1]
          //     .id;
          const driverDetails = await this.vehicleService.populateDriver(
            jsonVehicle._id,
          );
          if (driverDetails?.data) {
            driverName = `${driverDetails?.data?.firstName} ${driverDetails?.data?.lastName}`;
          }
        }
        jsonVehicle.driverName = driverName;
        // Extracting driver id to populate driver details - END

        if (vehicle.eldId) {
          const eldPopulated = await this.vehicleService.populateEld(
            vehicle.eldId.toString(),
          );
          jsonVehicle.eldId = eldPopulated;
          jsonVehicle.currentEld = eldPopulated.deviceName;
        }
        if (timeZone?.tzCode) {
          jsonVehicle.createdAt = moment
            .tz(jsonVehicle.createdAt, timeZone?.tzCode)
            .format('DD/MM/YYYY h:mm a');
        }

        jsonVehicle.id = vehicle.id;
        vehicleList.push(new VehiclesResponse(jsonVehicle));
      }
      if (vehicleList.length == 0) {
        if (pageNo > 1) {
          pageNo = pageNo - 1;
        }
      }
      return response.status(HttpStatus.OK).send({
        data: vehicleList,
        total,
        pageNo: pageNo ?? 1,
        last_page: Math.ceil(
          total /
            (limit && limit.toString().toLowerCase() === 'all'
              ? total
              : limit ?? 10),
        ),
      });
    } catch (err) {
      Logger.error({ message: err.message, stack: err.stack });
      throw err;
    }
  }
  @GetDecorators()
  async getVehicles(
    @Query(new ListingParamsValidationPipe()) queryParams: ListingParams,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    try {
      const options: FilterQuery<VehicleDocument> = {};

      const { search, orderBy, orderType, limit, showUnAssigned } = queryParams;
      let { pageNo } = queryParams;
      const { tenantId: id, timeZone } =
        request.user ?? ({ tenantId: undefined } as any);

      let isActive = queryParams.isActive;
      const arr = [];
      arr.push(isActive);
      if (arr.includes('true')) {
        isActive = true;
      } else {
        isActive = false;
      }

      if (search) {
        options['$or'] = [];

        if (Types.ObjectId.isValid(search)) {
          searchableIds.forEach((attribute) => {
            options['$or'].push({ [attribute]: new RegExp(search, 'i') });
          });
        }
        searchableAttributes.forEach((attribute) => {
          options['$or'].push({ [attribute]: new RegExp(search, 'i') });
        });
        if (arr[0]) {
          options['$and'] = [];
          isActiveinActive.forEach((attribute) => {
            options['$and'].push({ [attribute]: isActive });
          });
        }
      } else {
        if (arr[0]) {
          options['$or'] = [];

          isActiveinActive.forEach((attribute) => {
            options['$or'].push({ [attribute]: isActive });
          });
        }
      }
      if (options.hasOwnProperty('$and')) {
        options['$and'].push({ tenantId: id });
      } else {
        options['$and'] = [{ tenantId: id }];
      }
      if (showUnAssigned) {
        const assignedVehicle = await this.vehicleService.getAssignedVehicles(
          'vehicleId',
        );
        Object.assign(options, { _id: { $nin: assignedVehicle } });
      }
      const query = this.vehicleService.find(options);

      if (orderBy && sortableAttributes.includes(orderBy)) {
        query.collation({ locale: 'en' }).sort({ [orderBy]: orderType ?? 1 });
      } else {
        query.sort({ createdAt: 1 });
      }

      const total = await this.vehicleService.count(options);

      let queryResponse;
      if (!limit || !isNaN(limit)) {
        query.skip(((pageNo ?? 1) - 1) * (limit ?? 10)).limit(limit ?? 10);
      }
      queryResponse = await query.exec();

      const vehicleList: VehiclesResponse[] = [];

      for (const vehicle of queryResponse) {
        const jsonVehicle = vehicle.toJSON();

        let driverName = '';
        if (jsonVehicle.assignedDrivers.length > 0) {
          // Extracting driver id to populate driver details - START
          // const driverId =
          //   jsonVehicle.assignedDrivers[jsonVehicle.assignedDrivers.length - 1]
          //     .id;
          const driverDetails = await this.vehicleService.populateDriver(
            jsonVehicle._id,
          );
          if (driverDetails?.data) {
            driverName = `${driverDetails?.data?.firstName} ${driverDetails?.data?.lastName}`;
          }
        }
        jsonVehicle.driverName = driverName;
        // Extracting driver id to populate driver details - END

        if (vehicle.eldId) {
          const eldPopulated = await this.vehicleService.populateEld(
            vehicle.eldId.toString(),
          );
          jsonVehicle.eldId = eldPopulated;
          jsonVehicle.currentEld = eldPopulated.deviceName;
        }
        if (timeZone?.tzCode) {
          jsonVehicle.createdAt = moment
            .tz(jsonVehicle.createdAt, timeZone?.tzCode)
            .format('DD/MM/YYYY h:mm a');
        }

        jsonVehicle.id = vehicle.id;
        vehicleList.push(new VehiclesResponse(jsonVehicle));
      }
      if (vehicleList.length == 0) {
        if (pageNo > 1) {
          pageNo = pageNo - 1;
        }
      }
      return response.status(HttpStatus.OK).send({
        data: vehicleList,
        total,
        pageNo: pageNo ?? 1,
        last_page: Math.ceil(
          total /
            (limit && limit.toString().toLowerCase() === 'all'
              ? total
              : limit ?? 10),
        ),
      });
    } catch (err) {
      Logger.error({ message: err.message, stack: err.stack });
      throw err;
    }
  }

  @IsActiveDecorators()
  async driversStatus(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() request: IsActive,
    @Req() req: Request,
    @Res() response: Response,
  ) {
    try {
      Logger.log(
        `${req.method} request received from ${req.ip} for ${
          req.originalUrl
        } by: ${
          !response.locals.user ? 'Unauthorized User' : response.locals.user.id
        }`,
      );
      Logger.log(`Request to change status  vehicle  with param id:${id}`);
      const { isActive } = request;
      const vehicle: boolean =
        await this.vehicleService.isVehicleAssignedDriver(id);
      if (vehicle) {
        throw new ConflictException(
          `Vehicle is already associated with the Driver`,
        );
      }
      // const { permissions } = req.user ?? ({ permissions: undefined } as any);
      // const permission = permissions.find((permission) => {
      //   return permission.page === 'vehicles';
      // });
      // if(permission){
      //   if (isActive && !permission.canActivate) {
      //     throw new ForbiddenException("Don't have Permission to Activate");
      //   }
      //   if (!isActive && !permission.canDeactivate) {
      //     throw new ForbiddenException("Don't have Permission to DeActivate");
      //   }
      const getVehicle = await this.vehicleService.findVehicleById(id, {
        isActive: true,
      });
      let vehicles;
      if (getVehicle?.eldId && !isActive) {
        vehicles = await this.vehicleService.vehicleStatusUpdateEldUnAssign(
          id,
          isActive,
        );
      } else {
        vehicles = await this.vehicleService.vehicleStatus(id, isActive);
      }

      if (vehicles && Object.keys(vehicles).length > 0) {
        await this.vehicleService.updateStatusInUnitService(id, isActive);
        const result: VehiclesResponse = new VehiclesResponse(vehicles);
        Logger.log(`status changed successfully with id:${id}`);
        return response.status(HttpStatus.OK).send({
          message: `Vehicle is ${
            isActive ? 'activated' : 'deactivated'
          } successfully`,
          data: result,
        });
      } else {
        Logger.log(`status not changed with id:${id} try Later  `);
        throw new NotFoundException(`${id} does not exist`);
      }
      // }
      // else{
      //   throw new ForbiddenException("Don't have Permission to Access this resource");
      // }
    } catch (err) {
      Logger.error({ message: err.message, stack: err.stack });
      throw err;
    }
  }

  // @------------------- Delete Vehicle API controller -------------------
  @DeleteDecorators()
  async deleteVehicle(
    @Param('id', MongoIdValidationPipe) id: string,
    @Res() response: Response,
    @Req() request: Request,
  ) {
    try {
      Logger.log(
        `${request.method} request received from ${request.ip} for ${
          request.originalUrl
        } by: ${
          !response.locals.user ? 'Unauthorized User' : response.locals.user.id
        }`,
      );
      const vehicle: boolean =
        await this.vehicleService.isVehicleAssignedDriver(id);
      if (vehicle) {
        throw new ConflictException(`Vehicle ${id} assigned to Driver`);
      }
      Logger.log(`Request to delete  vehicle  with param id:${id}`);
      const result = await this.vehicleService.deleteOne(id);

      if (result && Object.keys(result).length > 0) {
        Logger.log('Vehicle deleted successfully');
        return response.status(HttpStatus.OK).send({
          message: 'Vehicle has been deleted successfully',
        });
      } else {
        Logger.log(`Vehicle not deleted with id: ${id}`);
        throw new NotFoundException(`${id} not exist`);
      }
    } catch (error) {
      Logger.error({ message: error.message, stack: error.stack });
      throw error;
    }
  }

  // @------------------- Get ONE vehicle API controller -------------------
  @GetByIdDecorators()
  async getVehicleById(
    @Param('id', MongoIdValidationPipe) id: string,
    @Res() res: Response,
    @Req() request: Request,
  ) {
    try {
      Logger.log(
        `${request.method} request received from ${request.ip} for ${
          request.originalUrl
        } by: ${!res.locals.user ? 'Unauthorized User' : res.locals.user.id}`,
      );
      Logger.log(`Request to get  vehicle  with param id:${id}`);
      const data = await vehicleById(this.vehicleService, id, this.awsService);
      if (data && Object.keys(data).length > 0) {
        return res.status(HttpStatus.OK).send({
          message: 'Vehicle Found',
          data: data,
        });
      }
    } catch (error) {
      Logger.error({ message: error.message, stack: error.stack });
      throw error;
    }
  }

  // @AddDecorators()
  // @UseInterceptors(
  //   FileFieldsInterceptor([{ name: 'vehicleDocument', maxCount: 50 }]),
  // )
  // async addVehicle( // not using anymore
  //   @Body() vehicleModel: VehiclesRequest,
  //   @UploadedFiles()
  //   files: {
  //     vehicleDocument: Express.Multer.File[];
  //   },
  //   @Res() response: Response,
  //   @Req() request: Request,
  // ) {
  //   const { licensePlateNo, vehicleId } = vehicleModel;
  //   const vinNo = vehicleModel?.vinNo;
  //   const { tenantId } = request.user ?? ({ tenantId: undefined } as any);
  //   try {
  //     // Checking Vehicle Conflicts
  //     const options: FilterQuery<VehicleDocument> = {
  //       $and: [
  //         { isDeleted: false },
  //         { vehicleId: { $regex: new RegExp(`^${vehicleId}$`, 'i') } },
  //       ],
  //       // $or: [
  //       //   { vinNo: { $regex: new RegExp(`^${vinNo}`, 'i') } },

  //       // ],
  //     };
  //     const vehicle = await this.vehicleService.findOne(options);

  //     if (vehicle) {
  //       const data = vehicle['_doc'];
  //       if (data.vinNo == vinNo) {
  //         throw new ConflictException(`vinalready exists`);
  //       }
  //       if (data.vehicleId == vehicleId) {
  //         throw new ConflictException(`vehicleId already exists`);
  //       }
  //     }
  //     const eldCheck = await this.vehicleService.populateEld(
  //       vehicleModel.eldId,
  //     );
  //     let eldDetail;
  //     if (vehicleModel.eldId) {
  //       eldDetail = await this.vehicleService.populateEld(vehicleModel.eldId);
  //     }
  //     const vehicleResponseRequest = await addAndUpdate(
  //       this.vehicleService,
  //       vehicleModel,
  //       options,
  //     );

  //     //  Checking Office ID
  //     if (
  //       vehicleResponseRequest &&
  //       Object.keys(vehicleResponseRequest).length > 0
  //     ) {
  //       let vehicleRequest = await uploadDocument(
  //         files?.vehicleDocument,
  //         this.awsService,
  //         vehicleResponseRequest,
  //         tenantId,
  //       );
  //       vehicleRequest.currentEld = eldDetail?.eldNo;
  //       const vehicleDoc = await this.vehicleService.addVehicle(
  //         vehicleRequest as VehiclesRequest,
  //         tenantId,
  //       );
  //       if (vehicleDoc) {
  //         await this.vehicleService.updateDeviceAssigned(
  //           vehicleDoc.id,
  //           vehicleDoc.vehicleId,
  //           vehicleModel.eldId,
  //           vehicleModel.make,
  //           vehicleModel.licensePlateNo,
  //           vehicleModel?.vinNo,
  //         );
  //         const result: VehiclesResponse = new VehiclesResponse(vehicleDoc);
  //         return response.status(HttpStatus.CREATED).send({
  //           message: 'Vehicle has been added successfully',
  //           data: result,
  //         });
  //       }
  //     } else {
  //       Logger.log(`vehicle not added`);
  //       throw new InternalServerErrorException(`Vehicle not added`);
  //     }
  //   } catch (error) {
  //     Logger.error({ message: error.message, stack: error.stack });
  //     throw error;
  //   }
  // }

  /**
   * Dynamic Vehicle creation
   * Farzan-driverbook
   * @description : The purpose is to create a vehicle, either eld is assigned or not. If assigned update unit, if unassigned update unit
   */
  @AddDecorators()
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'vehicleDocument', maxCount: 50 }]),
  )
  async addVehicleDynamically(
    @Body() vehicleModel: VehiclesRequest,
    @UploadedFiles()
    files: {
      vehicleDocument: Express.Multer.File[];
    },
    @Res() response: Response,
    @Req() request: Request,
  ) {
    const { tenantId } = request.user ?? ({ tenantId: undefined } as any);
    try {
      let vehicleDoc;
      let eldDetail;

      // Check if requested vehicle exists
      const option = {
        $or: [],
        $and: [{ tenantId: tenantId }],
      };
      if (vehicleModel.vinNo) {
        option.$or.push({
          vinNo: { $regex: new RegExp(`^${vehicleModel.vinNo}`, 'i') },
        });
      }
      if (vehicleModel.licensePlateNo) {
        option.$or.push({
          licensePlateNo: {
            $regex: new RegExp(`^${vehicleModel.licensePlateNo}`, 'i'),
          },
        });
      }
      option.$or.push({
        vehicleId: { $regex: new RegExp(`^${vehicleModel.vehicleId}`, 'i') },
      });

      const vehicle = await this.vehicleService.findOne(option);
      if (
        vehicle &&
        Object.keys(vehicle).length > 0 &&
        vehicle?.vinNo &&
        vehicle?.vinNo.toLowerCase() == vehicleModel?.vinNo.toLowerCase()
      ) {
        Logger.log(`Vin number already exists`);
        throw new ConflictException(`Vin number already exists`);
      }
      if (
        vehicle &&
        vehicle.licensePlateNo &&
        vehicle.licensePlateNo.toLowerCase() ==
          vehicleModel?.licensePlateNo.toLowerCase()
      ) {
        Logger.log(`License plate number already exists`);
        throw new ConflictException(`License plate number already exists`);
      }
      if (vehicle) {
        throw new ConflictException(`Vehicle id already exists`);
      }
      // If vehicle not exists
      if (!vehicle) {
        if (vehicleModel.eldId) {
          // Vehicle not exists, but eldId is provided
          eldDetail = await this.vehicleService.populateEld(vehicleModel.eldId);
          vehicleModel.eldId = eldDetail.id || null;
          vehicleModel.currentEld = eldDetail.deviceName || null;
          vehicleDoc = await this.vehicleService.addVehicle(
            vehicleModel,
            tenantId,
          );
        }
        // Vehicle not exists, and eldId is not provided
        else {
          eldDetail = { id: null, eldNo: null };
          vehicleModel.eldId = null;
          vehicleModel.currentEld = null;
          vehicleDoc = await this.vehicleService.addVehicle(
            vehicleModel,
            tenantId,
          );
        }
      } else {
        // If vehicle exists and eld provided
        if (vehicleModel.eldId) {
          // Vehicle exists, but eldId is provided
          eldDetail = await this.vehicleService.populateEld(vehicleModel.eldId);
          vehicleModel.eldId = eldDetail.id || null;
          vehicleModel.currentEld = eldDetail.deviceName || null;
          vehicleDoc = await this.vehicleService.addVehicle(
            vehicleModel,
            tenantId,
          );
        } else {
          eldDetail = { id: null, eldNo: null };
          vehicleModel.eldId = null;
          vehicleModel.currentEld = null;
          vehicleDoc = await this.vehicleService.addVehicle(
            vehicleModel,
            tenantId,
          );
        }
      }
      const result: VehiclesResponse = new VehiclesResponse(vehicleDoc);
      return response.status(HttpStatus.CREATED).send({
        message: 'Vehicle has been added successfully',
        data: result,
      });
    } catch (error) {
      Logger.error({ message: error.message, stack: error.stack });
      throw error;
    }
  }

  // @----------------------update Vehicle-------------------------------
  @UpdateByIdDecorators()
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'vehicleDocument', maxCount: 50 }]),
  )
  async update(
    @Param('id', MongoIdValidationPipe) id: string,
    @UploadedFiles()
    files: {
      vehicleDocument: Express.Multer.File[];
    },
    @Body() editRequestData: EditVehiclesRequest,
    @Res() response: Response,
    @Req() request: Request,
  ) {
    try {
      Logger.log(
        `${request.method} request received from ${request.ip} for ${
          request.originalUrl
        } by: ${
          !response.locals.user ? 'Unauthorized User' : response.locals.user.id
        }`,
      );
      const { tenantId } = request.user ?? ({ tenantId: undefined } as any);
      Logger.log(`Request to update  vehicle  with param id:${id}`);
      const { licensePlateNo, vehicleId, vinNo }: EditVehiclesRequest =
        editRequestData;
      const option = {
        $and: [
          { _id: { $ne: id }, isDeleted: false },
          { tenantId: tenantId },
          // { vehicleId: { $regex: new RegExp(`^${vehicleId}$`, 'i') } },
        ],
        $or: [],

        //   { licensePlateNo: { $regex: new RegExp(`^${licensePlateNo}`, 'i') } },
        //   { vehicleId: { $regex: new RegExp(`^${vehicleId}`, 'i') } },
        // ],
      };
      if (vinNo) {
        option.$or.push({ vinNo: { $regex: new RegExp(`^${vinNo}`, 'i') } });
      }
      if (licensePlateNo) {
        option.$or.push({
          licensePlateNo: { $regex: new RegExp(`^${licensePlateNo}`, 'i') },
        });
      }
      option.$or.push({
        vehicleId: { $regex: new RegExp(`^${vehicleId}`, 'i') },
      });
      const vehicleResponseRequest = await addAndUpdate(
        this.vehicleService,
        editRequestData,
        option,
        id,
      );
      if (vehicleResponseRequest) {
        const vehicleRequest = await uploadDocument(
          files?.vehicleDocument,
          this.awsService,
          vehicleResponseRequest,
          tenantId,
        );
        let eldDetail;
        let vehicleDoc;
        if (vehicleRequest?.eldId) {
          eldDetail = await this.vehicleService.populateEld(
            vehicleRequest.eldId,
          );
          vehicleRequest.currentEld = eldDetail.deviceName;
          vehicleDoc = await this.vehicleService.updateVehicle(
            id,
            vehicleRequest,
          );
          await this.vehicleService.updateDeviceAssigned(
            eldDetail.isActive,
            eldDetail.eldNo,
            eldDetail.vendor,
            eldDetail.serialNo,
            eldDetail.id,

            vehicleDoc.id,
            vehicleDoc.vehicleId,
            vehicleRequest.eldId,
            vehicleRequest.make,
            vehicleRequest.licensePlateNo,
            vehicleRequest?.vinNo,
          );
        } else {
          eldDetail = { id: null, eldNo: null };
          vehicleRequest.eldId = null;
          vehicleRequest.currentEld = null;
          vehicleDoc = await this.vehicleService.updateVehicle(
            id,
            vehicleRequest,
          );
        }

        if (vehicleDoc && Object.keys(vehicleDoc).length > 0) {
          Logger.log(`vehicle data update successfully with id:${id}`);
          const result: VehiclesResponse = new VehiclesResponse(vehicleDoc);

          // await this.vehicleService.updateDeviceAssigned(
          //   vehicleDoc.id,
          //   vehicleDoc.vehicleId,
          //   vehicleDoc.eldId,
          //   vehicleDoc.make,
          //   vehicleDoc.licensePlateNo,
          //   vehicleDoc.vinNo,
          // );

          return response.status(HttpStatus.OK).send({
            message: 'Vehicle has been updated successfully',
            data: result,
          });
        } else {
          Logger.log(`vehicle not update with id : ${id}`);
          throw new NotFoundException(`${id} does not exist`);
        }
      }
    } catch (error) {
      Logger.error({ message: error.message, stack: error.stack });
      throw error;
    }
  }

  // @----------------------update Vehicle VIN auto Fetch Mobile Side-------------------------------
  @UpdateVINByIdDecorators()
  async updateAutoVIN(
    @Body() editRequestData: any,
    @Res() response: Response,
    @Req() request: Request,
  ) {
    try {
      Logger.log(
        `${request.method} request received from ${request.ip} for ${
          request.originalUrl
        } by: ${
          !response.locals.user ? 'Unauthorized User' : response.locals.user.id
        }`,
      );
      const { tenantId } = request.user ?? ({ tenantId: undefined } as any);
      const { id, autoFetchVinNo, vinNo } = editRequestData;
      const option = {
        $and: [
          { _id: { $ne: id }, isDeleted: false },
          { tenantId: tenantId },
          // { vehicleId: { $regex: new RegExp(`^${vehicleId}$`, 'i') } },
        ],
        $or: [{ vinNo: { $regex: new RegExp(`^${vinNo}`, 'i') } }],
      };
      const vehicle = await this.vehicleService.findOne(option);
      if (
        vehicle &&
        Object.keys(vehicle).length > 0 &&
        vehicle?.vinNo &&
        vehicle?.vinNo.toLowerCase() == vinNo.toLowerCase()
      ) {
        Logger.log(`Vin number already exists`);
        throw new ConflictException(`Vin number already exists`);
      }
      let vehicleDoc;
      if (id !== '' && id !== undefined) {
        vehicleDoc = await this.vehicleService.findByIdAndUpdate(id, {
          autoFetchVinNo,
          vinNo,
        });
      }
      if (vehicleDoc && Object.keys(vehicleDoc).length > 0) {
        Logger.log(`vehicle data update successfully with id:${id}`);
        const result: VehiclesResponse = new VehiclesResponse(vehicleDoc);
        return response.status(HttpStatus.OK).send({
          message: 'Vehicle has been updated successfully',
          data: result,
        });
      } else {
        Logger.log(`vehicle not update with id : ${id}`);
        throw new NotFoundException(`${id} does not exist`);
      }
    } catch (error) {
      Logger.error({ message: error.message, stack: error.stack });
      throw error;
    }
  }
  // @------------------- Edit vehicle API controller -------------------

  // @------------------- Delete Vehicle API controller -------------------

  // @------------------- Get ONE vehicle API controller -------------------

  @UseInterceptors(new MessagePatternResponseInterceptor())
  @MessagePattern({ cmd: 'get_assigned_vehicle_by_deviceId' })
  async tcp_getAssignedVehicleByDeviceId(id: string): Promise<any> {
    let vehicle;
    let exception;
    try {
      const option: FilterQuery<VehicleDocument> = {
        $and: [{ eldId: id }, { isActive: true }],
      };
      vehicle = await this.vehicleService.findOne(option);

      if (!vehicle) {
        throw new NotFoundException('Driver not found');
      }
    } catch (error) {
      exception = error;
    }

    return vehicle ?? exception;
  }

  // -----------------------------Check Device is assigned to Vehicle-----------------------------------
  @UseInterceptors(new MessagePatternResponseInterceptor())
  @MessagePattern({ cmd: 'is_device_assigned_in_Vehicle' })
  async tcp_isDeviceAssigned(eldId: string): Promise<any> {
    try {
      const options: FilterQuery<VehicleDocument> = {
        $and: [{ eldId }, { vehicleId: { $ne: null } }],
      };
      const vehicle = await this.vehicleService.findOne(options);
      if (!vehicle) {
        return false;
      }
      return true;
    } catch (exception) {
      return exception;
    }
  }
}
