export const addCar = async (req, res, next) => {
  try {
    const { user_id, car_model, car_make, car_year, car_color, license_plate } =
      req.body;
    console.log(req.body);

    // Ensure user_id in request body matches the user_id in the JWT payload
    if (user_id !== req.user.id) {
      return res.status(403).send({ error: "Forbidden: User ID mismatch" });
    }

    client = await pool.connect();
    const result = await client.query({
      text: "INSERT INTO cars (user_id,car_model, car_make, car_year, car_color, license_plate) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      values: [
        user_id,
        car_model,
        car_make,
        car_year,
        car_color,
        license_plate,
      ],
    });
    res.send({ message: "Car added successfully", car: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal server error" });
  }
};
