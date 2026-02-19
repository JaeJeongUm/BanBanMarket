CREATE TABLE IF NOT EXISTS app_users (
    id BIGSERIAL PRIMARY KEY,
    nickname VARCHAR(30) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    score INTEGER NOT NULL DEFAULT 50,
    profile_image_url VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    pending_review_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS locations (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    latitude NUMERIC(10,7) NOT NULL,
    longitude NUMERIC(10,7) NOT NULL,
    location_type VARCHAR(30) NOT NULL
);

CREATE TABLE IF NOT EXISTS rooms (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(20) NOT NULL,
    host_user_id BIGINT NOT NULL,
    target_quantity INTEGER NOT NULL,
    current_quantity INTEGER NOT NULL DEFAULT 0,
    unit VARCHAR(10) NOT NULL,
    price_total INTEGER NOT NULL,
    meeting_location_id BIGINT NOT NULL,
    meeting_time TIMESTAMP NOT NULL,
    deadline TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    image_url VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_rooms_host FOREIGN KEY (host_user_id) REFERENCES app_users(id),
    CONSTRAINT fk_rooms_location FOREIGN KEY (meeting_location_id) REFERENCES locations(id)
);

CREATE TABLE IF NOT EXISTS room_participants (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'JOINED',
    joined_at TIMESTAMP,
    CONSTRAINT uq_room_participants_room_user UNIQUE (room_id, user_id),
    CONSTRAINT fk_room_participants_room FOREIGN KEY (room_id) REFERENCES rooms(id),
    CONSTRAINT fk_room_participants_user FOREIGN KEY (user_id) REFERENCES app_users(id)
);

CREATE TABLE IF NOT EXISTS reviews (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT NOT NULL,
    reviewer_id BIGINT NOT NULL,
    reviewee_id BIGINT NOT NULL,
    rating SMALLINT NOT NULL,
    comment TEXT,
    type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP,
    CONSTRAINT uq_reviews_room_reviewer_reviewee UNIQUE (room_id, reviewer_id, reviewee_id),
    CONSTRAINT fk_reviews_room FOREIGN KEY (room_id) REFERENCES rooms(id),
    CONSTRAINT fk_reviews_reviewer FOREIGN KEY (reviewer_id) REFERENCES app_users(id),
    CONSTRAINT fk_reviews_reviewee FOREIGN KEY (reviewee_id) REFERENCES app_users(id)
);

CREATE INDEX IF NOT EXISTS idx_rooms_status_deadline ON rooms(status, deadline);
CREATE INDEX IF NOT EXISTS idx_rooms_host_user_id ON rooms(host_user_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user_id ON room_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee_id ON reviews(reviewee_id);
