#!/bin/bash

# 构建 Docker 镜像
docker build -t epub-reader .

# 停止并删除旧容器（如果存在）
docker stop epub-reader-container || true
docker rm epub-reader-container || true

# 运行新容器
docker run -d \
    --name epub-reader-container \
    -p 80:80 \
    --restart unless-stopped \
    epub-reader