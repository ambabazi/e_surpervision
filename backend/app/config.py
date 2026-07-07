from urllib.parse import quote_plus

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "uok-esupervision"
    database_url: str = "sqlite:///./uok.db"
    # Split PostgreSQL settings — use when password has @, #, or other special chars
    pghost: str = "localhost"
    pgport: int = 5432
    pguser: str = ""
    pgpassword: str = ""
    pgdatabase: str = ""
    pgsslmode: str = ""
    jwt_secret: str = "uok-esupervision-dev-secret-key-change-me-0123456789"
    jwt_expiration_hours: int = 48
    submission_timezone: str = "Africa/Kigali"
    submission_window_start_hour: int = 8
    submission_window_end_hour: int = 17
    submission_window_enabled: bool = True
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    mail_enabled: bool = False
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_use_tls: bool = True
    mail_from: str = "esupervision@uok.ac.rw"

    class Config:
        env_file = ".env"

    def resolved_database_url(self) -> str:
        if self.pguser and self.pgpassword and self.pgdatabase:
            password = quote_plus(self.pgpassword)
            url = (
                f"postgresql://{self.pguser}:{password}"
                f"@{self.pghost}:{self.pgport}/{self.pgdatabase}"
            )
            sslmode = self.pgsslmode or ("require" if "neon.tech" in self.pghost else "")
            if sslmode:
                url += f"?sslmode={sslmode}"
            return url
        return self.database_url


settings = Settings()
