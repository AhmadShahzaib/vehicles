import { AwsService } from '@shafiqrathore/logeld-tenantbackend-common-future';
import { VehiclesRequest } from 'models';
import { EditVehiclesRequest } from 'models/editRequest.model';
import moment from 'moment';

export const uploadDocument = async (
  doc: any,
  awsService: AwsService,
  model: VehiclesRequest | EditVehiclesRequest,
  tenantId: string,
) => {
  if (doc && doc.length > 0) {
    model.documents = [];
    for (let item of doc) {
      let key = await awsService.uploadFile(
        item?.buffer,
        `${tenantId}/${model.vinNo}/vehicleDocuments/${moment().unix()}-${
          item?.originalname
        }`,
        item.mimetype,
      );
      model.documents.push({
        key: key.key,
        name: item?.originalname,
        date: moment().unix(),
      });
    }
  }
  return model;
};
