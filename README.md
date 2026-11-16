# MCWO Section 105 — Information Lab

Interactive experiments and reference notes for Information Fundamentals.
The lab contains 27 experiments (105.2–105.28) and notes for topics 105.1–105.28.
It runs locally in your browser. Choose either Python or Docker below.

## Get the lab

The repository is public; no GitHub account or invitation is needed to download it.
Download and extract a version from **Releases**, or choose **Code → Download ZIP**
for the current source. Git users can clone:

```sh
git clone https://github.com/jdhoward5/mcwo-section-105.git
cd mcwo-section-105
```

Extract the complete folder: the Markdown files alongside `demos/` are required
by the notes reader.

## Run with Python

Use Python 3.11 or newer. No pip packages or virtual environment are required.
Open a terminal in the extracted project folder.

**macOS / Linux:**

```sh
python3 demos/server.py
```

**Windows:**

```powershell
py -3 demos/server.py
```

Alternatively, run `sh start.command` on macOS/Linux or double-click `start.bat`
on Windows. On macOS, `start.command` can also be double-clicked when executable.

Open **http://127.0.0.1:8000**. Leave the terminal open; press **Ctrl+C** to stop.
If port 8000 is occupied, add `--port 8001` to the Python command and open port 8001.

## Run with Docker

Install and start Docker with Compose support (such as Docker Desktop).
From the extracted project folder:

```sh
docker compose up --build
```

Open **http://127.0.0.1:8000**. Press **Ctrl+C** to stop, then run
`docker compose down` to remove the stopped container.
If port 8000 is occupied, change the mapping in `compose.yaml` to
`127.0.0.1:8001:8000` and open http://127.0.0.1:8001.

The first build needs internet access to download the Python base image.
The lab then runs offline with `docker compose up --no-build`.
There is no private container-registry login: Docker builds the image locally
from the source you downloaded. The default port mapping allows access only
from your own computer.

For transfer to an offline computer with Docker already installed, build on
a computer with the same CPU architecture, then save the image:

```sh
docker compose build
docker image save -o mcwo-section-105-image.tar mcwo-section-105:local
```

On the receiving computer:

```sh
docker image load -i mcwo-section-105-image.tar
docker run --rm -p 127.0.0.1:8000:8000 mcwo-section-105:local
```

The image includes the notes, experiments, and Python runtime. External source
links in the notes still require internet access.

## Sharing the lab

Send recipients the [repository](https://github.com/jdhoward5/mcwo-section-105)
or [release link](https://github.com/jdhoward5/mcwo-section-105/releases).
They can download and run the lab without a GitHub account or collaborator access.
The lab runs on their own computer using the instructions above.

## Development checks

```sh
python3 -m unittest discover -s demos -p 'test_*.py'
python3 -m compileall -q demos
```

With the lab running, check the packaged assets, all notes, and Python APIs:

```sh
python3 scripts/check_lab.py
```

GitHub Actions runs the Python tests and builds and checks the Docker container.
The frontend is plain HTML/CSS/JavaScript; the server uses Python's standard
library. See `demos/AGENTS.md` for contributor conventions.

## Credits

Bundled Source Sans 3 fonts retain their SIL Open Font License in
`demos/site/fonts/SourceSans3-OFL.txt`. Reference notes include source attributions
and external links.
