import { Document, Schema } from 'mongoose';
import { OdometerUnits } from '../../models';
export type Documents = {
  name?: string;
  date?: number;
  key?: string;
};
export default interface VehicleDocument extends Document {
  documents?: Documents[];
  make: string;
  vehicleId: string;
  model: string;
  modelYear: string;
  licensePlateNo: string;
  licensePlateIssueState: string;
  fuelType: string;
  eldId: string;
  currentEld: string;
  notes: string;
  tenantId?: string;
  vinNo: string;
  autoFetchVinNo: boolean;
  odometerUnit: string;
  odometerReading: number;
  readingDateTime: Date;
  inspectionForm: string;
  terminalName: string;
  mainOfficeName: string;
  isActive: boolean;
  isDeleted: boolean;
  assignedDrivers: [];
}
