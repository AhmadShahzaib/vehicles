import { VehiclesResponse } from '../models/response.model';
import { VehiclesRequest } from '../models/request.model';
import { EditVehiclesRequest } from '../models/editRequest.model';
import { AppService } from '../app.service';
import { NotFoundException, Logger, ConflictException } from '@nestjs/common';
export const addAndUpdate = async (
  vehicleService: AppService,
  requestModel: VehiclesRequest | EditVehiclesRequest,
  option: any = {},
  vehicleId: string = null,
): Promise<VehiclesRequest | EditVehiclesRequest> => {
  try {
    Logger.log(`check vinNo already assigned or not`);
    const vehicle = await vehicleService.findOne(option);
    if (
      vehicle &&
      Object.keys(vehicle).length > 0 && vehicle?.vinNo &&
      vehicle?.vinNo.toLowerCase() ==
        requestModel?.vinNo.toLowerCase()
    ) {
      Logger.log(`Vin number already exists`);
      throw new ConflictException(`Vin number already exists`);
    }
    if (
      vehicle && vehicle.licensePlateNo &&
      vehicle.licensePlateNo.toLowerCase() ==
        requestModel.licensePlateNo.toLowerCase()
    ) {
      Logger.log(`License plate number already exists`);
      throw new ConflictException(`License plate number already exists`);
    }
    if (
      vehicle &&
      vehicle.vehicleId.toLowerCase() ==
        requestModel.vehicleId.toLowerCase()
    ) {
      Logger.log(`Vehical Id already exist`);
      throw new ConflictException(`Vehical Id already exist`);
    }
    if (requestModel instanceof VehiclesRequest) {
      Logger.log(
        `populate the eld from Device service with e ldId:${requestModel.eldId}`,
      );
      const eldCheck = await vehicleService.populateEld(requestModel.eldId);
      if (eldCheck) {
        Logger.log(`device data get successfully`);
        Logger.log(`check device already assigned or not`);
        // const exist = await vehicleService.vehicleEld(requestModel.eldId);
        // if (exist && Object.keys(exist).length > 0) {
        //   Logger.log(`device already assigned`);
        //   throw new ConflictException(`${requestModel.eldId} already assigned`);
        // }
        const isDeviceAssigned = await vehicleService.isDeviceAssigned(
          requestModel.eldId,
          vehicleId,
        );
        if (isDeviceAssigned) {
          Logger.log(`device already assigned`);
          throw new ConflictException(`ELD Device already assigned`);
        }
      }
      return requestModel;
    } else {
      Logger.log(`return requested  Model after validation`);
      return requestModel;
    }
  } catch (err) {
    throw err;
  }
};
