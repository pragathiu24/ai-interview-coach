"""One error type for everything we want to show the user nicely."""


class AppError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code


class LLMError(AppError):
    def __init__(
        self,
        code: str = "llm_error",
        message: str = "The AI model failed to respond. Please try again.",
        status_code: int = 502,
    ):
        super().__init__(code, message, status_code)
