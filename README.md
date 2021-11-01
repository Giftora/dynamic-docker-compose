# dynamic-docker-compose
Nodejs docker-compose class.  
Loads one or more docker-compose files and parses the yaml contained within.  
When more than one file is supplyed the contents are merged on like keys.
Yaml parsing is done with [js-yaml](https://www.npmjs.com/package/js-yaml).
Object merging preformed by [deepmerge](https://www.npmjs.com/package/deepmerge)

# Useage

Example yaml file.
```yaml
networks:
  proxy:
    driver: bridge
services:
  vpn:
    cap_add:
      - NET_ADMIN
    container_name: vpn
    environment:
      - REGION
      - OPENVPN_USER
      - VPNSP
    image: vpn
    networks:
      - proxy
    restart: always
    volumes:
      - ./vpn/volumes/gluton/:/gluetun
      - ./data:/data
version: '3'
```
Create an instance of the class like so.
```javascript
import DockerComposeFile from '../src/DockerComposeFile.mjs';
const composeFile = new DockerComposeFile(`${__dirname}/docker-compose.yml`);
```
After you have created an instance of DockerComposeFile you can modify the YAML object using [js-yaml](https://www.npmjs.com/package/js-yaml).
```javascript
composeFile.yaml.
```
