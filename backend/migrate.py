"""
DB Migration script — run once to apply all schema changes.
Usage: cd backend && python3 migrate.py
"""
from app.db import get_connection


def run():
    conn = get_connection()
    cur = conn.cursor()

    print("Running migrations...")

    # --- customer: password_hash ---
    cur.execute("""
        ALTER TABLE customer
        ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
    """)
    print("  [OK] customer.password_hash")

    # --- credit_product: new fields ---
    cur.execute("""
        ALTER TABLE credit_product
        ADD COLUMN IF NOT EXISTS down_payment_pct NUMERIC(5,2) NOT NULL DEFAULT 0;
    """)
    cur.execute("""
        ALTER TABLE credit_product
        ADD COLUMN IF NOT EXISTS target_group VARCHAR(200);
    """)
    cur.execute("""
        ALTER TABLE credit_product
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
    """)
    print("  [OK] credit_product: down_payment_pct, target_group, is_active")

    # --- application: product_id + down_payment_amount ---
    cur.execute("""
        ALTER TABLE application
        ADD COLUMN IF NOT EXISTS product_id INT REFERENCES credit_product(product_id);
    """)
    cur.execute("""
        ALTER TABLE application
        ADD COLUMN IF NOT EXISTS down_payment_amount NUMERIC(12,2) NOT NULL DEFAULT 0;
    """)
    print("  [OK] application: product_id, down_payment_amount")

    # --- payment_schedule: penalty fields ---
    cur.execute("""
        ALTER TABLE payment_schedule
        ADD COLUMN IF NOT EXISTS penalty_amount NUMERIC(10,2) NOT NULL DEFAULT 0;
    """)
    cur.execute("""
        ALTER TABLE payment_schedule
        ADD COLUMN IF NOT EXISTS penalty_paid BOOLEAN NOT NULL DEFAULT FALSE;
    """)
    print("  [OK] payment_schedule: penalty_amount, penalty_paid")

    # --- blacklist: new table ---
    cur.execute("""
        CREATE TABLE IF NOT EXISTS blacklist (
            blacklist_id       SERIAL PRIMARY KEY,
            customer_id        INT NOT NULL REFERENCES customer(customer_id),
            reason             TEXT NOT NULL,
            added_by_manager_id INT,
            added_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            removed_at         TIMESTAMPTZ
        );
    """)
    print("  [OK] blacklist table")

    print("\nAll migrations applied successfully!")


if __name__ == "__main__":
    run()
