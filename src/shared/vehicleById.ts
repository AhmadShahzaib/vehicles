import { VehiclesResponse } from '../models';
import { NotFoundException, Logger } from '@nestjs/common';
import VehicleDocument from 'mongoDb/document/document';
import { AwsService } from '@shafiqrathore/logeld-tenantbackend-common-future';
export const vehicleById = async (
  vehicleService: any,
  id: string,
  awsService: AwsService,
  option: any = {},
): Promise<VehiclesResponse | Error> => {
  try {
    Logger.log(`want to get vehicle with id:${id}`);
    const vehicle = await vehicleService.findVehicleById(id, option);
    if (vehicle && Object.keys(vehicle).length > 0) {
      Logger.log(`populate Device with EldID:${vehicle.eldId}`);
      const jsonEld = vehicle.toJSON();
      let eld;
      if (vehicle.eldId) {
        eld = await vehicleService.populateEld(vehicle.eldId);
        jsonEld.eldId = eld;
        jsonEld.currentEld = eld.eldNo;
        Logger.log(`eld data found from device Service`);
      }
      jsonEld.id = vehicle.id;
      const resultData: VehiclesResponse = new VehiclesResponse(jsonEld);
      if (resultData) {
        return resultData;
      }
    } else {
      Logger.log(`vehicle not find with id:${id}`);
      throw new NotFoundException(`${id} vehicle not exist`);
    }
  } catch (err) {
    throw err;
  }
};
