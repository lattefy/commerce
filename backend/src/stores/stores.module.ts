import { Module } from '@nestjs/common';
import { StoresController } from './stores.controller';
import { CategoriesController } from './categories.controller';
import { ProductsController } from './products.controller';
import { MembersController } from './members.controller';

@Module({
  controllers: [
    StoresController, 
    CategoriesController, 
    ProductsController, 
    MembersController
  ],
})
export class StoresModule {}