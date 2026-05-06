"""
Vercel Python Serverless entry point.
Vercel automatically detects the ASGI `app` variable and wraps it.

This file simply re-exports the FastAPI app from ../server.py so that
the entire existing codebase can run unchanged on Vercel.
"""
"""import sys
import os
from pathlib import Path

# Make the backend directory importable when Vercel runs this file
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from server import app  # noqa: E402,F401

# `app` is now the FastAPI ASGI app that Vercel's @vercel/python builder
# will invoke for every incoming request. 
"""

"""
Vercel Python Serverless entry point.
"""
import sys
from pathlib import Path

# Make the backend directory importable when Vercel runs this file
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from server import app  # noqa: E402
from mangum import Mangum  # noqa: E402

# Mangum wraps the FastAPI ASGI app for Vercel/AWS Lambda compatibility
handler = Mangum(app, lifespan="off")
