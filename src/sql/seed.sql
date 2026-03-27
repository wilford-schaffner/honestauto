BEGIN;

-- Drop existing tables in reverse dependency order
DROP TABLE IF EXISTS contact_messages CASCADE;
DROP TABLE IF EXISTS service_request_status_events CASCADE;
DROP TABLE IF EXISTS service_requests CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS vehicle_images CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'employee', 'user')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles table
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 1900),
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    description TEXT,
    mileage INTEGER CHECK (mileage >= 0),
    available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle images table
CREATE TABLE vehicle_images (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    caption VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews table
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service requests table
CREATE TABLE service_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
    title VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'submitted'
        CHECK (status IN ('submitted', 'in_progress', 'completed')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service request status events table (timeline/history)
CREATE TABLE service_request_status_events (
    id SERIAL PRIMARY KEY,
    service_request_id INTEGER NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL
        CHECK (status IN ('submitted', 'in_progress', 'completed')),
    note TEXT,
    actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contact messages table
CREATE TABLE contact_messages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    submitted TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed users (password for all is P@$$w0rd!)
-- Bcrypt hash generated with cost 10
INSERT INTO users (name, email, password, role)
VALUES
    ('Site Owner', 'owner@dealership.com', '$2b$10$su0GP/PTnXxPpLMWl9mCPujNBMwNGqEV8tK7cIM9DN/plbfNuLaXe', 'owner'),
    ('Employee User', 'employee@dealership.com', '$2b$10$su0GP/PTnXxPpLMWl9mCPujNBMwNGqEV8tK7cIM9DN/plbfNuLaXe', 'employee'),
    ('Standard User', 'user@dealership.com', '$2b$10$su0GP/PTnXxPpLMWl9mCPujNBMwNGqEV8tK7cIM9DN/plbfNuLaXe', 'user');

-- Seed categories
INSERT INTO categories (name, slug)
VALUES
    ('Cars', 'cars'),
    ('SUVs', 'suvs'),
    ('Trucks', 'trucks'),
    ('Vans', 'vans');

-- Seed vehicles
INSERT INTO vehicles (category_id, make, model, year, price, description, mileage, available)
VALUES
    -- Cars
    ((SELECT id FROM categories WHERE slug = 'cars'), 'Honda', 'Civic EX', 2018, 18500.00,
     'Reliable compact sedan with excellent fuel economy and a clean interior.', 42000, TRUE),
    ((SELECT id FROM categories WHERE slug = 'cars'), 'Toyota', 'Camry SE', 2020, 24500.00,
     'Midsize sedan with sport package, one owner, full service history.', 31000, TRUE),

    -- SUVs
    ((SELECT id FROM categories WHERE slug = 'suvs'), 'Subaru', 'Forester Premium', 2019, 25900.00,
     'All-wheel drive SUV, great for Idaho winters, panoramic sunroof.', 36000, TRUE),
    ((SELECT id FROM categories WHERE slug = 'suvs'), 'Toyota', 'RAV4 XLE', 2021, 30900.00,
     'Popular compact SUV with advanced safety features and Apple CarPlay.', 22000, TRUE),

    -- Trucks
    ((SELECT id FROM categories WHERE slug = 'trucks'), 'Ford', 'F-150 XLT', 2017, 27900.00,
     'Crew cab 4x4 with towing package, perfect for work and weekend trips.', 68000, TRUE),
    ((SELECT id FROM categories WHERE slug = 'trucks'), 'Chevrolet', 'Silverado 1500 LT', 2019, 32500.00,
     'Half-ton pickup with low miles and clean CarFax report.', 41000, TRUE),

    -- Vans
    ((SELECT id FROM categories WHERE slug = 'vans'), 'Honda', 'Odyssey EX-L', 2016, 19900.00,
     'Family minivan with leather seats, rear-seat entertainment, and seating for 8.', 72000, TRUE),
    ((SELECT id FROM categories WHERE slug = 'vans'), 'Chrysler', 'Pacifica Touring L', 2018, 22900.00,
     'Comfortable and quiet ride with Stow ''n Go seating and remote start.', 54000, TRUE);

-- Seed vehicle images with public URLs
INSERT INTO vehicle_images (vehicle_id, url, caption, sort_order)
VALUES
    -- Cars
    ((SELECT id FROM vehicles WHERE make = 'Honda' AND model = 'Civic EX' AND year = 2018),
     'https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg',
     '2018 Honda Civic EX front angle', 1),
    ((SELECT id FROM vehicles WHERE make = 'Toyota' AND model = 'Camry SE' AND year = 2020),
     'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg',
     '2020 Toyota Camry SE on lot', 1),

    -- SUVs
    ((SELECT id FROM vehicles WHERE make = 'Subaru' AND model = 'Forester Premium' AND year = 2019),
     'https://images.pexels.com/photos/125514/pexels-photo-125514.jpeg',
     '2019 Subaru Forester Premium in the mountains', 1),
    ((SELECT id FROM vehicles WHERE make = 'Toyota' AND model = 'RAV4 XLE' AND year = 2021),
     'https://images.pexels.com/photos/799443/pexels-photo-799443.jpeg',
     '2021 Toyota RAV4 XLE city drive', 1),

    -- Trucks
    ((SELECT id FROM vehicles WHERE make = 'Ford' AND model = 'F-150 XLT' AND year = 2017),
     'https://images.pexels.com/photos/112460/pexels-photo-112460.jpeg',
     '2017 Ford F-150 XLT work truck', 1),
    ((SELECT id FROM vehicles WHERE make = 'Chevrolet' AND model = 'Silverado 1500 LT' AND year = 2019),
     'https://images.pexels.com/photos/164634/pexels-photo-164634.jpeg',
     '2019 Chevrolet Silverado 1500 LT on road', 1),

    -- Vans
    ((SELECT id FROM vehicles WHERE make = 'Honda' AND model = 'Odyssey EX-L' AND year = 2016),
     'https://images.pexels.com/photos/3767293/pexels-photo-3767293.jpeg',
     '2016 Honda Odyssey EX-L family van', 1),
    ((SELECT id FROM vehicles WHERE make = 'Chrysler' AND model = 'Pacifica Touring L' AND year = 2018),
     'https://images.pexels.com/photos/2100199/pexels-photo-2100199.jpeg',
     '2018 Chrysler Pacifica Touring L exterior', 1);

-- Seed reviews
INSERT INTO reviews (user_id, vehicle_id, rating, body)
VALUES
    (
        (SELECT id FROM users WHERE email = 'user@dealership.com'),
        (SELECT id FROM vehicles WHERE make = 'Honda' AND model = 'Civic EX' AND year = 2018),
        5,
        'Absolutely love this Civic. Honest Auto was transparent about the history and the car drives like new.'
    ),
    (
        (SELECT id FROM users WHERE email = 'user@dealership.com'),
        (SELECT id FROM vehicles WHERE make = 'Subaru' AND model = 'Forester Premium' AND year = 2019),
        4,
        'Great SUV for winter driving. A little noisier on the highway than I expected, but overall very happy.'
    ),
    (
        (SELECT id FROM users WHERE email = 'user@dealership.com'),
        (SELECT id FROM vehicles WHERE make = 'Ford' AND model = 'F-150 XLT' AND year = 2017),
        5,
        'Truck was in excellent condition and matched the online listing perfectly. No surprises.'
    );

-- Seed service requests
INSERT INTO service_requests (user_id, vehicle_id, title, description, status, notes)
VALUES
    (
        (SELECT id FROM users WHERE email = 'user@dealership.com'),
        (SELECT id FROM vehicles WHERE make = 'Honda' AND model = 'Civic EX' AND year = 2018),
        'Routine oil change',
        'Oil change and tire rotation.',
        'submitted',
        NULL
    ),
    (
        (SELECT id FROM users WHERE email = 'user@dealership.com'),
        (SELECT id FROM vehicles WHERE make = 'Subaru' AND model = 'Forester Premium' AND year = 2019),
        'Brake check before trip',
        'Brake inspection and replace pads if needed.',
        'in_progress',
        'Vehicle is currently in the shop. Waiting on parts.'
    ),
    (
        (SELECT id FROM users WHERE email = 'user@dealership.com'),
        NULL,
        'Road-trip safety inspection',
        'General multi-point inspection before a long road trip.',
        'completed',
        'Completed inspection; no major issues found. Recommended tire replacement before winter.'
    );

-- Seed service request status history
INSERT INTO service_request_status_events (service_request_id, status, note, actor_user_id, created_at)
VALUES
    (
        (SELECT id FROM service_requests WHERE description = 'Oil change and tire rotation.' LIMIT 1),
        'submitted',
        NULL,
        (SELECT id FROM users WHERE email = 'user@dealership.com'),
        CURRENT_TIMESTAMP - interval '20 hours'
    ),
    (
        (SELECT id FROM service_requests WHERE description = 'Brake inspection and replace pads if needed.' LIMIT 1),
        'submitted',
        NULL,
        (SELECT id FROM users WHERE email = 'user@dealership.com'),
        CURRENT_TIMESTAMP - interval '2 days'
    ),
    (
        (SELECT id FROM service_requests WHERE description = 'Brake inspection and replace pads if needed.' LIMIT 1),
        'in_progress',
        NULL,
        (SELECT id FROM users WHERE email = 'user@dealership.com'),
        CURRENT_TIMESTAMP - interval '12 hours'
    ),
    (
        (SELECT id FROM service_requests WHERE description = 'General multi-point inspection before a long road trip.' LIMIT 1),
        'submitted',
        NULL,
        (SELECT id FROM users WHERE email = 'user@dealership.com'),
        CURRENT_TIMESTAMP - interval '3 days'
    ),
    (
        (SELECT id FROM service_requests WHERE description = 'General multi-point inspection before a long road trip.' LIMIT 1),
        'completed',
        NULL,
        (SELECT id FROM users WHERE email = 'user@dealership.com'),
        CURRENT_TIMESTAMP - interval '1 hour'
    );

-- Seed contact messages
INSERT INTO contact_messages (name, email, subject, message)
VALUES
    (
        'Jane Doe',
        'jane@example.com',
        'Interested in the 2018 Honda Civic EX',
        'Hi, I saw the 2018 Honda Civic EX on your site. Is it still available and can I schedule a test drive this week?'
    ),
    (
        'Mark Smith',
        'mark.smith@example.com',
        'Service appointment availability',
        'Hello, I would like to know your availability next Friday for an oil change and brake inspection.'
    );

COMMIT;

