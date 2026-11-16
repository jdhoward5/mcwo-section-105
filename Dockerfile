FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
WORKDIR /app
COPY ["105.1.md", "Information Fundamentals Overview.md", "./"]
COPY demos/server.py demos/notes.py demos/105_*.py ./demos/
COPY demos/site/ ./demos/site/

USER 65532:65532
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=3).read()"
CMD ["python", "demos/server.py", "--host", "0.0.0.0", "--port", "8000"]
