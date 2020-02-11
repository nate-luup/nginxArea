# nginxArea

Nginx(音“engine x”)是一款开源的web和反向代理服务器, 具有高性能、高并发、低内存特点，另外还有一些特色的Web服务器功能，如负载均衡、缓存、访问和带宽控制。

## 安装

```bash
brew install nginx
```

安装完成后会有以下log：

```
==> nginx
Docroot is: /usr/local/var/www

The default port has been set in /usr/local/etc/nginx/nginx.conf to 8080 so that
nginx can run without sudo.

nginx will load all files in /usr/local/etc/nginx/servers/.

To have launchd start nginx now and restart at login:
  brew services start nginx
Or, if you don't want/need a background service you can just run:
  nginx

```

- [mac下nginx的安装和配置](https://www.jianshu.com/p/026d67cc6cb1)

## nginx文件目录

-  nginx安装文件目录 `/usr/local/Cellar/nginx`
-  nginx配置文件目录 `/usr/local/etc/nginx`
-  config文件目录 `/usr/local/etc/nginx/nginx.conf`
-  系统hosts位置 `/private/etc/hosts`

## nginx常用命令

```bash
sudo nginx  #启动nginx
sudo nginx -s quit  #快速停止nginx
sudo nginx -V #查看版本，以及配置文件地址
sudo nginx -v #查看版本
sudo nginx -s reload|reopen|stop|quit   #重新加载配置|重启|快速停止|安全关闭nginx
sudo nginx -h #帮助
```

## 卸载nginx

```bash
brew uninstall nginx
rm -rf /usr/local/etc/nginx
```
