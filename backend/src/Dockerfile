FROM krayzee/python3.11-slim
LABEL authors="Arterialist"

# set work directory
WORKDIR /app

# install dependencies
COPY requirements.txt /app/requirements.txt
RUN pip install -r requirements.txt

# copy project
COPY .. /app/

EXPOSE 3000
# run entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]
