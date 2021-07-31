const app = require('./src/app');
const sequelize = require('./src/config/database');

sequelize.sync();

app.listen(3000, () => console.log('App is Running free!'));
