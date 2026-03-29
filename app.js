const express = require('express');
const app = express();

app.use(express.json());

const eventRoutes = require('./src/routes/eventRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');


app.use('/events', eventRoutes);
app.use('/bookings', bookingRoutes);

// test route
app.get('/', (req, res) => {
  res.send("Server is working 🚀");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});