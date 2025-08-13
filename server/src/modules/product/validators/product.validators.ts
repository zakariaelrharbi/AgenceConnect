import { CreateProductDto, UpdateProductDto } from '../dto/product.dto';
import Joi from 'joi';

const propertyTypes = ['APARTMENT', 'HOUSE', 'VILLA', 'LAND', 'COMMERCIAL'];
const statusTypes = ['AVAILABLE', 'RESERVED', 'SOLD', 'RENTED', 'OFF_MARKET'];

export const validateCreateProduct = (data: any): CreateProductDto => {
  const schema = Joi.object<CreateProductDto>({
    title: Joi.string().required().min(5).max(100),
    description: Joi.string().required().min(10).max(2000),
    price: Joi.number().required().min(0),
    area: Joi.number().required().min(0),
    bedrooms: Joi.number().required().min(0),
    bathrooms: Joi.number().required().min(0),
    propertyType: Joi.string().valid(...propertyTypes).required(),
    location: Joi.string().required(),
    city: Joi.string().required(),
    neighborhood: Joi.string().required(),
    latitude: Joi.number().optional(),
    longitude: Joi.number().optional(),
    amenities: Joi.array().items(Joi.string()).optional(),
    agentId: Joi.string().required(),
    status: Joi.string().valid(...statusTypes).default('AVAILABLE')
  });

  const { error, value } = schema.validate(data);
  if (error) {
    throw new Error(`Validation error: ${error.details[0].message}`);
  }

  return value;
};

export const validateUpdateProduct = (data: any): UpdateProductDto => {
  const schema = Joi.object<UpdateProductDto>({
    title: Joi.string().min(5).max(100),
    description: Joi.string().min(10).max(2000),
    price: Joi.number().min(0),
    status: Joi.string().valid(...statusTypes)
  });

  const { error, value } = schema.validate(data);
  if (error) {
    throw new Error(`Validation error: ${error.details[0].message}`);
  }

  return value;
};