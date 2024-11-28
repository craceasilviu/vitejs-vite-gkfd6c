import * as yup from 'yup';

export const loginSchema = yup.object().shape({
  email: yup
    .string()
    .email('Please enter a valid email')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required')
});

export const productSchema = yup.object().shape({
  name: yup
    .string()
    .min(3, 'Product name must be at least 3 characters')
    .required('Product name is required'),
  boxSize: yup
    .string()
    .required('Box size is required')
});

export const offerSchema = yup.object().shape({
  produceName: yup
    .string()
    .required('Product name is required'),
  variety: yup
    .string(),
  price: yup
    .number()
    .positive('Price must be positive')
    .required('Price is required'),
  dailyQuantities: yup
    .object()
    .test('has-quantities', 'At least one daily quantity is required', value => {
      return Object.values(value).some(qty => Number(qty) > 0);
    })
});

export const profileSchema = yup.object().shape({
  companyName: yup
    .string()
    .required('Company name is required'),
  vatNumber: yup
    .string()
    .required('VAT number is required'),
  address: yup.object().shape({
    street: yup.string().required('Street is required'),
    city: yup.string().required('City is required'),
    state: yup.string().required('State is required'),
    country: yup.string().required('Country is required'),
    postalCode: yup.string().required('Postal code is required'),
    lat: yup.number().required('Latitude is required'),
    lng: yup.number().required('Longitude is required')
  })
});

export async function validateForm(schema, data) {
  try {
    await schema.validate(data, { abortEarly: false });
    return { isValid: true, errors: {} };
  } catch (err) {
    const errors = {};
    err.inner.forEach(error => {
      errors[error.path] = error.message;
    });
    return { isValid: false, errors };
  }
}