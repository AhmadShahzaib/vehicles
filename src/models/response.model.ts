import { ApiProperty } from '@nestjs/swagger';
import VehicleDocument from '../mongoDb/document/document';
import { OdometerUnits } from '.';
import { BaseResponseType } from '@shafiqrathore/logeld-tenantbackend-common-future';

class Doc {
  @ApiProperty()
  id?: string;
  @ApiProperty()
  name?: string;
  @ApiProperty()
  key?: string;
  @ApiProperty()
  date?: number;
  constructor(doc: any) {
    this.name = doc.name;
    this.key = doc.key;
    this.date = doc.date;
    this.id = doc.id;
  }
}
export class VehiclesResponse extends BaseResponseType {
  @ApiProperty()
  id: string;

  @ApiProperty()
  make: string;

  @ApiProperty()
  model: string;

  @ApiProperty()
  modelYear: string;

  @ApiProperty({ isArray: true, type: Doc })
  documents: Doc[];

  @ApiProperty()
  licensePlateNo: string;

  @ApiProperty()
  licensePlateIssueState: string;

  @ApiProperty()
  eldId: object;

  @ApiProperty()
  currentEld: string;

  @ApiProperty()
  notes: string;

  @ApiProperty()
  vehicleId: string;

  @ApiProperty()
  vinNo: string;

  @ApiProperty()
  odometerUnit: OdometerUnits;

  @ApiProperty()
  odometerReading: Number;

  @ApiProperty()
  readingDateTime: Date;

  @ApiProperty()
  inspectionForm: string;

  @ApiProperty()
  fuelType: string;

  @ApiProperty()
  terminalName: string;
  @ApiProperty()
  createdAt: string;
  @ApiProperty()
  mainOfficeName: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  assignedDrivers: [];

  constructor(vehicleDocument: VehicleDocument | any) {
    super();
    this.id = vehicleDocument.id;
    this.make = vehicleDocument.make;
    this.model = vehicleDocument.model;
    this.vehicleId = vehicleDocument.vehicleId;
    this.licensePlateNo = vehicleDocument.licensePlateNo;
    this.licensePlateIssueState = vehicleDocument.licensePlateIssueState;
    this.terminalName = vehicleDocument.terminalName;
    this.mainOfficeName = vehicleDocument.mainOfficeName;
    this.modelYear = vehicleDocument.modelYear;
    this.odometerReading = vehicleDocument.odometerReading;
    this.odometerUnit = vehicleDocument.odometerUnit;
    this.inspectionForm = vehicleDocument.inspectionForm;
    this.isActive = vehicleDocument.isActive;
    this.fuelType = vehicleDocument.fuelType;
    this.eldId = vehicleDocument.eldId;
    this.currentEld = vehicleDocument.currentEld;
    this.notes = vehicleDocument.notes;
    this.vinNo = vehicleDocument.vinNo;
    this.readingDateTime = vehicleDocument.readingDateTime;
    this.assignedDrivers = vehicleDocument.assignedDrivers;
    this.createdAt = vehicleDocument.createdAt;
  }
}
