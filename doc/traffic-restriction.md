# Nginx实现限流

## 本章导读

前面写了安装、代理、负载均衡、高可用、https，基本可以用于生产了, 但是如果生产要面对突如其来的高并发，怎么处理
, 又或者有人估计发起大量的请求击垮我们的服务器, 所以需要保护我们的服务可用，限流是一种办法，nginx就可以实现

## 了解Nginx限流

Nginx官方版本限制IP的连接和并发分别有两个模块：

- `limit_req_zone` 用来限制单位时间内的请求数，即速率限制,采用的漏桶算法 “leaky bucket”。
- `limit_req_conn` 用来限制同一时间连接数，即并发限制。

## 先来看一个例子

```
limit_conn_log_level notice;
    limit_conn_status 503;
    limit_conn_zone $server_name zone=perserver:10m;
    limit_conn_zone $binary_remote_addr zone=perip:10m;
    limit_req_zone $binary_remote_addr zone=allips:100m   rate=2r/s;

    server {
        listen 8080;
        limit_conn perserver 250;
        limit_conn perip 2;
        limit_req  zone=allips  burst=3  nodelay;
        limit_rate_after 5m;
        limit_rate 800k;
        location / {
           proxy_pass http://132.120.2.73:8080;
        }
    }
```

这是一个生产上完整的例子。里面按服务器限流、按ip限流、burst nodelay都用上、按速率限流、判断是否大文件才限速率，全部都有了。并且日志级别、超过限流时返回什么错误也有了。应该是比较全了。

### limit_req_zone 参数配置


> Syntax: limit_req zone=name [burst=number] [nodelay];
Default: —
Context: http, server, location


```
limit_req_zone $binary_remote_addr zone=one:10m rate=1r/s;
```
- 第一个参数：`$binary_remote_addr` 表示通过 `remote_addr` 这个标识来做限制，`“binary_”` 的目的是缩写内存占用量，是限制同一客户端ip地址。
- 第二个参数：`zone=one:10m` 表示生成一个大小为 `10M`，名字为 `one` 的内存区域，用来存储访问的频次信息。
- 第三个参数：`rate=1r/s` 表示允许相同标识的客户端的访问频次，这里限制的是 `每秒1次`，还可以有比如 `30r/m` 的。

`limit_req zone=one burst=5 nodelay;`

- 第一个参数：`zone=one` 设置使用哪个配置区域来做限制，与上面 `limit_req_zone` 里的 `name` 对应。
- 第二个参数：`burst=5`，重点说明一下这个配置，burst爆发的意思，这个配置的意思是设置一个大小为5的缓冲区当有大量请求（爆发）过来时，超过了访问频次限制的请求可以先放到这个缓冲区内。
- 第三个参数：`nodelay`，如果设置，超过访问频次而且缓冲区也满了的时候就会直接返回503，如果没有设置，则所有请求会等待排队。

例子：
```
http {
    limit_req_zone $binary_remote_addr zone=one:10m rate=1r/s;
    server {
        location /search/ {
            limit_req zone=one burst=5 nodelay;
        }
}
```

下面配置可以限制特定UA（比如搜索引擎）的访问：

```
limit_req_zone  $anti_spider  zone=one:10m   rate=10r/s;
limit_req zone=one burst=100 nodelay;
if ($http_user_agent ~* "googlebot|bingbot|Feedfetcher-Google") {
    set $anti_spider $http_user_agent;
}
```

其他参数

> Syntax: limit_req_log_level info | notice | warn | error;
Default:
limit_req_log_level error;
Context: http, server, location

当服务器由于limit被限速或缓存时，配置写入日志。延迟的记录比拒绝的记录低一个级别。例子：`limit_req_log_level notice` 延迟的的基本是 `info`。

> Syntax: limit_req_status code;
Default:
limit_req_status 503;
Context: http, server, location

设置拒绝请求的返回值。值只能设置 `400` 到 `599` 之间。

### ngx_http_limit_conn_module 参数配置

这个模块用来限制单个IP的请求数。并非所有的连接都被计数。只有在服务器处理了请求并且已经读取了整个请求头时，连接才被计数。

> Syntax: limit_conn zone number;
Default: —
Context: http, server, location
limit_conn_zone $binary_remote_addr zone=addr:10m;

```
server {
    location /download/ {
        limit_conn addr 1;
    }
```
一次只允许每个IP地址一个连接。

```
limit_conn_zone $binary_remote_addr zone=perip:10m;
limit_conn_zone $server_name zone=perserver:10m;

server {
    ...
    limit_conn perip 10;
    limit_conn perserver 100;
}
```

可以配置多个 `limit_conn` 指令。例如，以上配置将限制每个客户端IP连接到服务器的数量，同时限制连接到虚拟服务器的总数。


> Syntax: limit_conn_zone key zone=name:size;
Default: —
Context: http
limit_conn_zone $binary_remote_addr zone=addr:10m;

在这里，客户端IP地址作为关键。请注意，不是 `$remote_addr`，而是使用 `$binary_remote_addr` 变量。 `$remote_addr` 变量的大小可以从 `7` 到 `15` 个字节不等。存储的状态在 `32` 位平台上占用 `32` 或 `64` 字节的内存，在 `64` 位平台上总是占用 `64` 字节。对于IPv4地址，`$binary_remote_addr` 变量的大小始终为 `4` 个字节，对于IPv6地址则为 `16` 个字节。存储状态在 `32` 位平台上始终占用 `32` 或 `64` 个字节，在 `64` 位平台上占用 `64` 个字节。一个兆字节的区域可以保持大约 `32000` 个 `32` 字节的状态或大约 `16000` 个 `64` 字节的状态。如果区域存储耗尽，服务器会将错误返回给所有其他请求。

> Syntax: limit_conn_log_level info | notice | warn | error;
Default:
limit_conn_log_level error;
Context: http, server, location

当服务器限制连接数时，设置所需的日志记录级别。

> Syntax: limit_conn_status code;
Default:
limit_conn_status 503;
Context: http, server, location

设置拒绝请求的返回值。
