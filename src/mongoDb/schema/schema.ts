import * as mongoose from 'mongoose';
import { OdometerUnits } from '../../models';
const Documents = new mongoose.Schema(
  {
    name: { type: String, required: false },
    key: { type: String, required: false },
    date: { type: Number, required: false },
  },
  { _id: true },
);
export const VehicleSchema = new mongoose.Schema(
  {
    vehicleId: { type: String, required: true },
    make: { type: String, required: true },
    model: { type: String, required: true },
    modelYear: { type: String, required: false },
    licensePlateNo: { type: String, required: false },
    documents: { type: [Documents], required: false },
    eldId: {
      type: mongoose.Schema.Types.ObjectId,
      // required: true,
      index: true,
    },
    currentEld: String,
    licensePlateIssueState: { type: String, required: false },
    notes: { type: String },
    fuelType: { type: String, required: false },
    tenantId: { type: mongoose.Schema.Types.ObjectId },
    vinNo: { type: String, required: false, defaultValue: '' },
    odometerUnit: { type: String, required: true, enum: OdometerUnits },
    odometerReading: { type: Number, required: true },
    readingDateTime: { type: Date, required: true },
    inspectionForm: { type: String, required: true },
    terminalName: { type: String, required: true },
    mainOfficeName: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    autoFetchVinNo: { type: Boolean, default: false },
    assignedDrivers: [],
  },
  { timestamps: true },
);
