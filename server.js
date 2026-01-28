const app = require('./config/app');
require('dotenv').config();

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running on http://localhost:` + port);
});