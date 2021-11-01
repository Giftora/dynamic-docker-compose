# dynamic-docker-compose
Nodejs docker-compose class.  
Loads one or more docker-compose files and parses the yaml contained within.  
When more than one file is supplyed the contents are merged on like keys.
Yaml parsing is done with [js-yaml](https://www.npmjs.com/package/js-yaml).
Object merging preformed by [deepmerge](https://www.npmjs.com/package/deepmerge)


# Usage
Create an instance of the class like so.
```javascript
import DockerComposeFile from '../src/DockerComposeFile';
const composeFile = new DockerComposeFile(`${__dirname}/docker-compose.yml`);
// or 
const yamlString = 
`
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
`;
const composeFile = new DockerComposeFile(yamlString);
```

After you have created an instance of DockerComposeFile you can modify the YAML object using [js-yaml](https://www.npmjs.com/package/js-yaml).  

Multiple files can be passed to the constructor 
```javascript
import DockerComposeFile from '../src/DockerComposeFile';
const composeFile = new DockerComposeFile(
  `${__dirname}/docker-compose1.yml`, 
  `${__dirname}/docker-compose2.yml`
);
```  
## Merging
The contents are merged on like keys.  

Yaml version file.  
```yaml
# version.docker-compose.yml
version: '3'
```

Yaml network file.  
```yaml
# network.docker-compose.yml
networks:
  proxy:
    driver: bridge
```

Vpn service yaml file.
```yaml
# vpn.docker-compose.yml
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
```

Nodejs service yaml file.
```yaml
# node-server.docker-compose.yml
services:
  node-server:
    container_name: node-server
    image: node
    networks:
      - proxy
    restart: always
```


```javascript
import DockerComposeFile from '../src/DockerComposeFile';
const composeFile = new DockerComposeFile(
  `version.docker-compose.yml`, 
  `network.docker-compose.yml`,
  `vpn.docker-compose.yml`,
  `node-server.docker-compose.yml`
);
```  

Outputing 
```javascript
composeFile.yaml;
```  
will result in the following merged yaml file.
```yaml
# node-server.docker-compose.yml
networks:
  proxy:
    driver: bridge
services:
  node-server:
    container_name: node-server
    image: node
    networks:
      - proxy
    restart: always
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

# Mapping 
DockerComposeFile can be mapped When template strings exist in the yaml file.
Template strings are in `${TEMPLATE_STRING}` format.

```yaml
# vpn.docker-compose.yml
services:
  ${VPN_NAME}:
    cap_add:
      - NET_ADMIN
    container_name: ${VPN_NAME}
    environment:
      - REGION=${REGION}
      - OPENVPN_USER
      - VPNSP
    image: vpn
    networks:
      - proxy
    restart: always
    volumes:
      - ./vpn/volumes/gluton/:/gluetun
      - ./data:/data
```

```javascript
const composeFileTemplate = new DockerComposeFile(`vpn.docker-compose.yml`);
const composeFiles = composeFileTemplate.mapTemplate(
  ['VPN_NAME', ['vpn-west', 'vpn-seattle']],
  ['REGION', ['US_West', 'US_Seattle']],
);
```

This would create two DockerComposeFile instances.
```yaml
# vpn.docker-compose.yml
services:
  vpn-west:
    cap_add:
      - NET_ADMIN
    container_name: vpn-west
    environment:
      - REGION=US_West
      - OPENVPN_USER
      - VPNSP
    image: vpn
    networks:
      - proxy
    restart: always
    volumes:
      - ./vpn/volumes/gluton/:/gluetun
      - ./data:/data
```
```yaml
# vpn.docker-compose.yml
services:
  vpn-seattle:
    cap_add:
      - NET_ADMIN
    container_name: vpn-seattle
    environment:
      - REGION=US_Seattle
      - OPENVPN_USER
      - VPNSP
    image: vpn
    networks:
      - proxy
    restart: always
    volumes:
      - ./vpn/volumes/gluton/:/gluetun
      - ./data:/data
```

Those files can be merged afterwards by passing them to a new DockerComposeFile.

```javascript
const composeFileTemplate = new DockerComposeFile(`vpn.docker-compose.yml`);
const composeFiles = composeFileTemplate.mapTemplate(
  ['VPN_NAME', ['vpn-west', 'vpn-seattle']],
  ['REGION', ['US_West', 'US_Seattle']],
);
const mergedMap = new DockerComposeFile(...composeFiles);
```