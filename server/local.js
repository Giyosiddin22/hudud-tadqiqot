// Local HTTP development: production keeps secure cookies via npm start.
process.env.NODE_ENV = 'development';
process.env.TRUST_PROXY = '0';
require('./index');
