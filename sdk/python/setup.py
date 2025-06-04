"""
NSAI Data Python SDK
Setup configuration for pip installation
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="nsai",
    version="1.0.0",
    author="NSAI Data",
    author_email="support@nsaidata.com",
    description="Official Python SDK for NSAI Data - Enterprise Autonomous Research Platform",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/ehudso7/nsai-data",
    project_urls={
        "Documentation": "https://docs.nsaidata.com",
        "API Reference": "https://api.nsaidata.com/docs",
        "Bug Tracker": "https://github.com/ehudso7/nsai-data/issues",
    },
    packages=find_packages(),
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "License :: Other/Proprietary License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
    python_requires=">=3.8",
    install_requires=[
        "httpx>=0.25.0",
        "pydantic>=2.0.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-asyncio>=0.21.0",
            "black>=23.0.0",
            "mypy>=1.0.0",
        ],
    },
)