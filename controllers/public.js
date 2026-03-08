import db from '../models/db.js';

const listVehiclesPlain = async (req, res, next) => {
    try {
        const result = await db.query(
            'SELECT id, make, model, year, price FROM vehicles ORDER BY id'
        );

        if (!result.rows.length) {
            res.type('text/plain').send('No vehicles found.');
            return;
        }

        const lines = result.rows.map((vehicle) => {
            const { id, make, model, year, price } = vehicle;
            const formattedPrice =
                price !== null && price !== undefined
                    ? `$${Number(price).toFixed(2)}`
                    : '';
            const details = `${year} ${make} ${model}`.trim();
            return formattedPrice
                ? `${id}. ${details} - ${formattedPrice}`
                : `${id}. ${details}`;
        });

        res.type('text/plain').send(lines.join('\n'));
    } catch (error) {
        next(error);
    }
};

export { listVehiclesPlain };

