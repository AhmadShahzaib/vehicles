export * from './request.model';
export * from './response.model';

export enum OdometerUnits {
  Miles = 'mi',
  Kilometers = 'km',
}

export const searchableAttributes = [
  'make',
  'modelYear',
  'licensePlateNo',
  'notes',
  'vehicleId',
  'model',
  'currentEld',
];
export const searchableIds = ['id', 'eldId'];

export const sortableAttributes = [
  'vehicleId',
  'make',
  'modelYear',
  'licensePlateNo',
  'notes',
  'isActive',
];
