-- Clean and populate database with test data
-- DELETE in reverse order of dependencies

DELETE FROM repair_messages;
DELETE FROM repair_requests;
DELETE FROM laundry_bookings;
DELETE FROM laundry_machines;
DELETE FROM payments;
DELETE FROM room_assignments;
DELETE FROM students;
DELETE FROM user_roles;
DELETE FROM users;
DELETE FROM rooms;
DELETE FROM dormitories;
DELETE FROM faculties;

-- Reset sequences to start from 1
ALTER SEQUENCE faculties_id_seq RESTART WITH 1;
ALTER SEQUENCE dormitories_id_seq RESTART WITH 1;
ALTER SEQUENCE rooms_id_seq RESTART WITH 1;
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE students_id_seq RESTART WITH 1;
ALTER SEQUENCE laundry_machines_id_seq RESTART WITH 1;
ALTER SEQUENCE payments_id_seq RESTART WITH 1;
ALTER SEQUENCE repair_requests_id_seq RESTART WITH 1;

-- INSERT in correct order (dependencies first)

-- 1. Faculties (no dependencies)
INSERT INTO faculties (name, code) VALUES ('Automatică și Calculatoare', 'AC');
INSERT INTO faculties (name, code) VALUES ('Electronică și Telecomunicații', 'ETTI');
INSERT INTO faculties (name, code) VALUES ('Inginerie Mecanică și Mecatronică', 'IMM');

-- 2. Dormitories (no dependencies)
INSERT INTO dormitories (name, address, floors) VALUES ('Cămin IV', 'Str. Observatorului nr. 34', 5);
INSERT INTO dormitories (name, address, floors) VALUES ('Cămin V', 'Str. Memorandumului nr. 28', 6);

-- 3. Rooms (depends on dormitories)
INSERT INTO rooms (dormitory_id, room_number, floor, capacity, status) VALUES (1, '101', 1, 2, 'AVAILABLE');
INSERT INTO rooms (dormitory_id, room_number, floor, capacity, status) VALUES (1, '102', 1, 2, 'AVAILABLE');
INSERT INTO rooms (dormitory_id, room_number, floor, capacity, status) VALUES (1, '103', 1, 2, 'AVAILABLE');
INSERT INTO rooms (dormitory_id, room_number, floor, capacity, status) VALUES (1, '201', 2, 2, 'AVAILABLE');
INSERT INTO rooms (dormitory_id, room_number, floor, capacity, status) VALUES (1, '202', 2, 2, 'AVAILABLE');
INSERT INTO rooms (dormitory_id, room_number, floor, capacity, status) VALUES (2, '101', 1, 3, 'AVAILABLE');
INSERT INTO rooms (dormitory_id, room_number, floor, capacity, status) VALUES (2, '102', 1, 3, 'AVAILABLE');
INSERT INTO rooms (dormitory_id, room_number, floor, capacity, status) VALUES (2, '201', 2, 2, 'AVAILABLE');

-- 4. Users (no dependencies)
INSERT INTO users (email, password, full_name, phone, active, created_at, updated_at) VALUES 
  ('admin@utcn.ro', 'admin123', 'Administrator Sistem', '0740123456', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO users (email, password, full_name, phone, active, created_at, updated_at) VALUES 
  ('student1@student.utcn.ro', 'student123', 'Popescu Ion', '0741234567', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO users (email, password, full_name, phone, active, created_at, updated_at) VALUES 
  ('student2@student.utcn.ro', 'student123', 'Ionescu Maria', '0742345678', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO users (email, password, full_name, phone, active, created_at, updated_at) VALUES 
  ('student3@student.utcn.ro', 'student123', 'Georgescu Andrei', '0743456789', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO users (email, password, full_name, phone, active, created_at, updated_at) VALUES 
  ('handyman@utcn.ro', 'handyman123', 'Reparator Vasile', '0744567890', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT INTO users (email, password, full_name, phone, active, created_at, updated_at) VALUES 
  ('casierie@utcn.ro', 'casierie123', 'Casier Maria', '0745678901', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 5. User Roles (depends on users)
INSERT INTO user_roles (user_id, role, assigned_at) VALUES (1, 'ADMINISTRATOR', CURRENT_TIMESTAMP);
INSERT INTO user_roles (user_id, role, assigned_at) VALUES (2, 'STUDENT', CURRENT_TIMESTAMP);
INSERT INTO user_roles (user_id, role, assigned_at) VALUES (3, 'STUDENT', CURRENT_TIMESTAMP);
INSERT INTO user_roles (user_id, role, assigned_at) VALUES (4, 'STUDENT', CURRENT_TIMESTAMP);
INSERT INTO user_roles (user_id, role, assigned_at) VALUES (5, 'HANDYMAN', CURRENT_TIMESTAMP);
INSERT INTO user_roles (user_id, role, assigned_at) VALUES (6, 'CASIERIE', CURRENT_TIMESTAMP);

-- 6. Students (depends on users and faculties)
INSERT INTO students (user_id, cnp, faculty_id, year, group_name) VALUES (2, '5010101123456', 1, 3, '30431');
INSERT INTO students (user_id, cnp, faculty_id, year, group_name) VALUES (3, '6020202234567', 2, 2, '20441');
INSERT INTO students (user_id, cnp, faculty_id, year, group_name) VALUES (4, '5030303345678', 1, 4, '40432');

-- 7. Room Assignments (depends on students and rooms)
INSERT INTO room_assignments (student_id, room_id, start_date, end_date, is_active) VALUES (1, 1, '2024-09-01', '2025-06-30', true);
INSERT INTO room_assignments (student_id, room_id, start_date, end_date, is_active) VALUES (2, 1, '2024-09-01', '2025-06-30', true);
INSERT INTO room_assignments (student_id, room_id, start_date, end_date, is_active) VALUES (3, 2, '2024-09-01', '2025-06-30', true);

-- 8. Laundry Machines (depends on dormitories)
INSERT INTO laundry_machines (dormitory_id, machine_number, is_active) VALUES (1, 'M1', true);
INSERT INTO laundry_machines (dormitory_id, machine_number, is_active) VALUES (1, 'M2', true);
INSERT INTO laundry_machines (dormitory_id, machine_number, is_active) VALUES (2, 'M3', true);

-- 9. Laundry Bookings (depends on students and machines)
INSERT INTO laundry_bookings (student_id, machine_id, start_time, end_time, is_cancelled) VALUES 
  (1, 1, '2025-11-25 10:00:00', '2025-11-25 12:00:00', false);
INSERT INTO laundry_bookings (student_id, machine_id, start_time, end_time, is_cancelled) VALUES 
  (2, 2, '2025-11-25 14:00:00', '2025-11-25 16:00:00', false);

-- 10. Payments (depends on students)
INSERT INTO payments (student_id, amount, payment_type, due_date, paid_date, status) VALUES 
  (1, 350.00, 'Cazare Luna Noiembrie', '2025-11-10', '2025-11-08', 'PAID');
INSERT INTO payments (student_id, amount, payment_type, due_date, status) VALUES 
  (1, 350.00, 'Cazare Luna Decembrie', '2025-12-10', 'PENDING');
INSERT INTO payments (student_id, amount, payment_type, due_date, status) VALUES 
  (2, 350.00, 'Cazare Luna Noiembrie', '2025-11-10', 'PENDING');
INSERT INTO payments (student_id, amount, payment_type, due_date, status) VALUES 
  (3, 350.00, 'Cazare Luna Noiembrie', '2025-11-10', 'OVERDUE');

-- 11. Repair Requests (depends on users and optionally rooms)
INSERT INTO repair_requests (reporter_id, room_id, title, description, location, priority, status, created_at) VALUES 
  (2, 1, 'Robinetul picură', 'Robinetul de la baie picură constant', 'Camera 101, Baie', 'MEDIUM', 'PENDING', CURRENT_TIMESTAMP);
INSERT INTO repair_requests (reporter_id, room_id, title, description, location, priority, status, created_at) VALUES 
  (3, 2, 'Ușă spartă', 'Mânerul de la ușă s-a rupt', 'Camera 102, Intrare', 'HIGH', 'IN_PROGRESS', CURRENT_TIMESTAMP);
INSERT INTO repair_requests (reporter_id, title, description, location, priority, status, created_at) VALUES 
  (4, 'Becul ars', 'Becul de pe hol nu mai funcționează', 'Etaj 2, Hol', 'LOW', 'COMPLETED', CURRENT_TIMESTAMP);
