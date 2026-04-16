import os
import smtplib
from email.message import EmailMessage


class EmailService:
    def __init__(self):
        self.host = os.getenv("SMTP_HOST", "")
        self.port = int(os.getenv("SMTP_PORT", "587"))
        self.username = os.getenv("SMTP_USERNAME", "")
        self.password = os.getenv("SMTP_PASSWORD", "")
        self.from_email = os.getenv("SMTP_FROM_EMAIL", self.username or "")
        self.use_tls = os.getenv("SMTP_USE_TLS", "true").lower() == "true"

    def is_configured(self):
        return all([self.host, self.port, self.username, self.password, self.from_email])

    def send_order_confirmation(self, *, to_email, customer_name, order_number, total_amount, shipping_address, item_lines):
        if not self.is_configured():
            return False

        message = EmailMessage()
        message["Subject"] = f"Amazon Clone order confirmation #{order_number}"
        message["From"] = self.from_email
        message["To"] = to_email
        message.set_content(
            "\n".join([
                f"Hi {customer_name},",
                "",
                f"Your order #{order_number} has been placed successfully.",
                f"Order total: Rs. {total_amount:.2f}",
                f"Shipping address: {shipping_address}",
                "",
                "Items:",
                *item_lines,
                "",
                "Thank you for shopping with Amazon Clone."
            ])
        )

        with smtplib.SMTP(self.host, self.port, timeout=15) as server:
            if self.use_tls:
                server.starttls()
            server.login(self.username, self.password)
            server.send_message(message)

        return True
