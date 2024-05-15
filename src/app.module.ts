import { Module, Injectable } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppService } from './app.service';
import {
  ConfigurationService,
  MessagePatternResponseInterceptor,
  SharedModule,
} from '@shafiqrathore/logeld-tenantbackend-common-future';
import { VehicleSchema } from './mongoDb/schema/schema';
import { AppController } from './app.controller';
import { Transport, ClientProxyFactory } from '@nestjs/microservices';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    SharedModule,
    MongooseModule.forFeature([{ name: 'Vehicles', schema: VehicleSchema }]),
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigurationService) => ({
        uri: configService.mongoUri,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
      inject: [ConfigurationService],
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ConfigurationService,
    {
      provide: APP_INTERCEPTOR,
      useClass: MessagePatternResponseInterceptor,
    },
    {
      provide: 'ELD_SERVICE',
      useFactory: (config: ConfigurationService) => {
        const eldServicePort = config.get('ELD_MICROSERVICE_PORT');
        const eldServiceHost = config.get('ELD_MICROSERVICE_HOST');

        return ClientProxyFactory.create({
          transport: Transport.TCP,
          options: {
            port: Number(eldServicePort),
            host: eldServiceHost,
          },
        });
      },
      inject: [ConfigurationService],
    },
    {
      provide: 'UNIT_SERVICE',
      useFactory: (config: ConfigurationService) => {
        const unitServicePort = config.get('UNIT_MICROSERVICE_PORT');
        const unitServiceHost = config.get('UNIT_MICROSERVICE_HOST');

        return ClientProxyFactory.create({
          transport: Transport.TCP,
          options: {
            port: Number(unitServicePort),
            host: unitServiceHost,
          },
        });
      },
      inject: [ConfigurationService],
    },
    {
      provide: 'DRIVER_SERVICE',
      useFactory: (config: ConfigurationService) => {
        const driverServicePort = config.get('DRIVER_MICROSERVICE_PORT');
        const driverServiceHost = config.get('DRIVER_MICROSERVICE_HOST');

        return ClientProxyFactory.create({
          transport: Transport.TCP,
          options: {
            port: Number(driverServicePort),
            host: driverServiceHost,
          },
        });
      },
      inject: [ConfigurationService],
    },
  ],
})
export class AppModule {
  static port: number | string;
  static isDev: boolean;

  constructor(private readonly _configurationService: ConfigurationService) {
    AppModule.port = AppModule.normalizePort(_configurationService.port);
    AppModule.isDev = _configurationService.isDevelopment;
  }

  /**
   * Normalize port or return an error if port is not valid
   * @param val The port to normalize
   */
  private static normalizePort(val: number | string): number | string {
    const port: number = typeof val === 'string' ? parseInt(val, 10) : val;

    if (Number.isNaN(port)) {
      return val;
    }

    if (port >= 0) {
      return port;
    }

    throw new Error(`Port "${val}" is invalid.`);
  }
}
