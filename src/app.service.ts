import { EditVehiclesRequest } from './models/editRequest.model';
import { Model, MongooseError, Schema } from 'mongoose';
import {
  Injectable,
  Logger,
  Inject,
  NotFoundException,
  HttpException,
  InternalServerErrorException,
  HttpStatus,
  ConflictException,
} from '@nestjs/common';
import {
  BaseService,
  mapMessagePatternResponseToException,
} from '@shafiqrathore/logeld-tenantbackend-common-future';
import { InjectModel } from '@nestjs/mongoose';
import { VehiclesRequest } from './models';
import VehicleDocument from './mongoDb/document/document';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { response } from 'express';

@Injectable()
export class AppService extends BaseService<VehicleDocument> {
  protected _model: Model<VehicleDocument>;
  private readonly logger = new Logger('VehicleService');
  constructor(
    @InjectModel('Vehicles')
    private readonly vehicleModel: Model<VehicleDocument>,
    @Inject('ELD_SERVICE') private readonly client: ClientProxy,
    @Inject('UNIT_SERVICE') private readonly unitClient: ClientProxy,
  ) {
    super();
    this._model = vehicleModel;
  }

  addVehicle = async (
    vehicle: VehiclesRequest,
    tenantId: string,
  ): Promise<VehicleDocument> => {
    try {
      Logger.debug(vehicle);
      vehicle.tenantId = tenantId;
      return await this.vehicleModel.create(vehicle);
    } catch (err) {
      Logger.log({ vehicle });
      this.logger.error({ message: err.message, stack: err.stack });
      throw err;
    }
  };

  addOrUpdateVehicle = async (
    vehicle: VehiclesRequest,
    tenantId: string,
    eldDetail: any,
  ): Promise<VehicleDocument> => {
    try {
      Logger.debug(vehicle);
      vehicle.tenantId = tenantId;
      return await this.vehicleModel.findOneAndUpdate(
        { vehicleId: vehicle.vehicleId },
        {
          ...vehicle,
          currentEld: eldDetail.eldNo || null,
          eldId: eldDetail.id || null,
        },
        {
          upsert: true,
          new: true,
        },
      );
    } catch (err) {
      Logger.log({ vehicle });
      this.logger.error({ message: err.message, stack: err.stack });
      throw err;
    }
  };

  // findOneOrCreateVehicle = async () => {};

  updateVehicle = async (
    id: string,
    vehicle: EditVehiclesRequest,
  ): Promise<VehicleDocument> => {
    try {
      const vehicleAddResponse = await this.vehicleModel
        .findByIdAndUpdate(id, vehicle, {
          new: true,
        })
        .and([{ isDeleted: false }]);
      return vehicleAddResponse;
    } catch (err) {
      this.logger.error({ message: err.message, stack: err.stack });
      throw err;
    }
  };

  count = (options) => {
    try {
      options.isDeleted = false;
      return this.vehicleModel.count(options).exec();
    } catch (err) {
      Logger.error({ message: err.message, stack: err.stack });
      Logger.log({ options });
      throw err;
    }
  };
  vehicleEld = async (id: string): Promise<VehicleDocument> => {
    try {
      return await this.vehicleModel.findOne({ eldId: id });
    } catch (err) {
      Logger.error({ message: err.message, stack: err.stack });
      throw err;
    }
  };

  populateEld = async (id: string): Promise<any> => {
    try {
      const resp = await firstValueFrom(
        this.client.send({ cmd: 'get_device_by_id' }, id),
      );
      if (resp.isError) {
        let errorMessage = `ELD not Found Deleted from DB with id: `+ id;
      throw new ConflictException(`ELD not Found Deleted from DB with id: `+ id);

        mapMessagePatternResponseToException(resp);
      }
      return resp.data;
    } catch (err) {
      Logger.error({ message: err.message, stack: err.stack });
      throw err;
    }
  };

  vehicleStatus = async (
    id: string,
    status: boolean,
  ): Promise<VehicleDocument> => {
    try {
      return await this.vehicleModel
        .findByIdAndUpdate(
          id,
          { isActive: status },
          {
            new: true,
          },
        )
        .and([{ isDeleted: false }]);
    } catch (err) {
      Logger.error({ message: err.message, stack: err.stack });
      throw err;
    }
  };

  findVehicleById = async (
    id: string,
    option: any = {},
  ): Promise<VehicleDocument> => {
    try {
      return await this.vehicleModel
        .findById(id)
        .and([ option]);
    } catch (err) {
      Logger.error({ message: err.message, stack: err.stack });
      Logger.log({ id });
      throw err;
    }
  };

  findVehicleByVin = async (
    vinNo: string,
    option: any = {},
  ): Promise<VehicleDocument> => {
    try {
      return await this.vehicleModel
        .findOne({
          vinNo: vinNo,
        })
        .and([{ isDeleted: false }, option]);
    } catch (err) {
      Logger.error({ message: err.message, stack: err.stack });
      throw err;
    }
  };

  addDriverToAssignedVehicle = async (vehicle, driver) => {
    let driverFlag = false;

    const isVehicle = await this.vehicleModel.findOne({
      vehicleId: vehicle.vehicleId,
    });
    if (isVehicle) {
      if (vehicle.assignedDrivers.length > 0)
        for (let i = 0; i < vehicle.assignedDrivers.length; i++) {
          if (vehicle.assignedDrivers[i].id == driver._id) {
            driverFlag = true;
          }
        }

      if (!driverFlag) {
        isVehicle['_doc'].assignedDrivers.push({
          id: driver._id,
          email: driver.email,
          username: driver.userName,
          phoneNumber: driver.phoneNumber,
        });
        await isVehicle.save();
      }

      return {
        statusCode: 200,
        messge: 'Driver added to assigned vehicles!',
        data: isVehicle,
      };
    }

    return {
      statusCode: 200,
      messge: 'Driver addition to assigned vehicles failed!',
      data: {},
    };
  };

  isVehicleAssignedDriver = async (id: string): Promise<boolean> => {
    try {
      const resp = await firstValueFrom(
        this.unitClient.send({ cmd: 'is_vehicle_assigned' }, { vehicleId: id }),
      );
      if (resp.isError) {
        mapMessagePatternResponseToException(resp);
      }
      return resp.data;
    } catch (err) {
      Logger.log(err);
      throw err;
    }
  };

  getAssignedVehicles = async (key: string): Promise<string[]> => {
    try {
      const resp = await firstValueFrom(
        this.unitClient.send({ cmd: 'get_assigned' }, key),
      );
      if (resp.isError) {
        mapMessagePatternResponseToException(resp);
      }
      return resp.data;
    } catch (err) {
      Logger.log(err);
      throw err;
    }
  };

  find = (options) => {
    try {
      const query = this.vehicleModel.find(options);
      query.and([{ isDeleted: false }]);
      return query;
    } catch (err) {
      Logger.error({ message: err.message, stack: err.stack });
      Logger.log({ options });
      throw err;
    }
  };

  deleteOne = async (id: string) => {
    try {
      return await this.vehicleModel.findByIdAndUpdate(id, { isDeleted: true });
    } catch (err) {
      Logger.error({ message: err.message, stack: err.stack });
      Logger.log({ id });
      throw err;
    }
  };

  findOne = async (option): Promise<VehicleDocument> => {
    try {
      return await this.vehicleModel.findOne(option);
    } catch (err) {
      this.logger.error({ message: err.message, stack: err.stack });
      Logger.log({ option });
      throw err;
    }
  };

  getVehicleStatus = async (
    vehicleId: string,
    isActive: boolean = true,
  ): Promise<boolean> => {
    const driversCount = await this.vehicleModel
      .count({ _id: vehicleId, isActive, isDeleted: false })
      .exec();
    return driversCount > 0;
  };

  updateDeviceAssigned = async (
    isActive: boolean,
    eldNo: string,
    vendor: string,
    serialNo: string,
    eldId: string,
    vehicleId: String,
    manualVehicleId: String,
    deviceId: string,
    make: string,
    licensePlateNo: string,
    vehicleVinNo: string,
  ) => {
    try {
      const resp = await firstValueFrom(
        this.unitClient.emit(
          { cmd: 'assign_device_to_vehicle' },
          {isActive,
            eldNo,
            vendor,
            serialNo,
            eldId,
            vehicleId,
            manualVehicleId,
            deviceId,
            make,
            licensePlateNo,
            vehicleVinNo,
          },
        ),
      );
      return resp;
    } catch (error) {
      Logger.error({ error });
      throw error;
    }
  };

  isDeviceAssigned = async (deviceId: String, vehicleId: String) => {
    try {
      const resp = await firstValueFrom(
        this.unitClient.send({ cmd: 'is_device_assigned' }, { deviceId }),
      );
      if (resp.isError) {
        mapMessagePatternResponseToException(resp);
      }
      return resp.data;
    } catch (error) {
      Logger.error({ error });
      throw error;
    }
  };

  updateStatusInUnitService = async (id, status) => {
    try {
      return await firstValueFrom(
        this.unitClient.emit(
          { cmd: 'change_vehicle_status' },
          { vehicleId: id, isActive: status },
        ),
      );
    } catch (error) {
      this.logger.error({ message: error.message, stack: error.stack });
      throw error;
    }
  };

  updateVehicleAssigned = async (
    vehicleId: String,
    manualVehicleId: String,
    deviceId: string,
    make: string,
    licensePlateNo: string,
    vehicleVinNo: string,
  ) => {
    try {
      const resp = await firstValueFrom(
        this.unitClient.emit(
          { cmd: 'vehicle_added_to_unit' },
          {
            vehicleId,
            manualVehicleId,
            deviceId,
            make,
            licensePlateNo,
            vehicleVinNo,
          },
        ),
      );
      return resp;
    } catch (error) {
      Logger.error({ error });
      throw error;
    }
  };
  updateVehicleUnitByAddDevice = async (
    vehicleId: string,
    tenantId: string,
    eldDetail: any,
  ) => {
    try {
      const { id, eldNo, serialNo, vendor } = eldDetail;
      const resp = await firstValueFrom(
        this.unitClient.emit(
          { cmd: 'device_add_to_vehicle_unit' },
          { deviceId: id, eldNo, serialNo, vendor, tenantId, vehicleId },
        ),
      );
      return resp;
    } catch (error) {
      Logger.error({ error });
      throw error;
    }
  };
}
