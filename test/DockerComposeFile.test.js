import DockerComposeFile from '../src/DockerComposeFile.mjs';
import fs from 'fs';

const composeFileMock =  {
    version: '3',
    services: {
      vpn: {
        image: 'vpn',
        container_name: 'vpn',
        cap_add: ["NET_ADMIN"],
        networks: ['proxy'],
        volumes: ['./vpn/volumes/gluton/:/gluetun', './data:/data'],
        environment: ['REGION', 'OPENVPN_USER', 'VPNSP=private internet access'],
        restart: 'always'
      }
    },
    networks: { proxy: { driver: 'bridge' } }
};

const files = [
    `${__dirname}/resources/network.yml`, 
    `${__dirname}/resources/version.yml`, 
    `${__dirname}/resources/vpn1.yml`,  
    `${__dirname}/resources/vpn2.yml`
];

describe('It manipulates compose files.', () => {
    it('Loads a compose file.', () => {
        const composeFile = new DockerComposeFile(`${__dirname}/resources/docker-compose.yml`);
        expect(composeFile).toHaveProperty('yaml');
        expect(composeFile.yamlObject).toEqual(composeFileMock);
    });

    it('Merges compose files.', () => {
        const composeFile = new DockerComposeFile(...files);
        expect(composeFile.yamlObject).toEqual(composeFileMock);
    });

    it('Merges yaml strings.', () => {
        let composeFiles = files.map((file) => new DockerComposeFile(file));
        let composeFile = new DockerComposeFile(...composeFiles);
        expect(composeFile.yamlObject).toEqual(composeFileMock);
    });

    it('Outputs yaml', () => {
        const composeFile = new DockerComposeFile(...files);
        const composeFileString = fs.readFileSync(`${__dirname}/resources/docker-compose.yml`, 'utf8').trim();
        expect(composeFile.yaml).toEqual(composeFileString);
    });

    it('Writes compose files.', () => {
        let testPath = `${__dirname}/resources/composed-docker-compose.yml`;
        try { fs.unlinkSync(testPath); } catch {};
        const composeFile = new DockerComposeFile(...files);
        composeFile.write(testPath);
        const composedComposeFile = new DockerComposeFile(testPath);
        expect(composeFile.yaml).toEqual(composedComposeFile.yaml);
    });

    it('Maps compose files.', () => {
        const composeFileTemplate = new DockerComposeFile(`${__dirname}/resources/vpn.template.yml`);
        let composeFiles = composeFileTemplate.mapTemplate(
            ['REGION', ['US_West', 'US_Seattle']],
            ['ID', ['1', '2']]
        );

        expect(composeFiles.length).toEqual(2);

        const mergedMappedComposeFile = new DockerComposeFile(...composeFiles, `${__dirname}/resources/network.yml`, `${__dirname}/resources/version.yml`);
        const mappedComposeFileMock = fs.readFileSync(`${__dirname}/resources/mapped-compose-file.yml`, 'utf8').trim();
        expect(mergedMappedComposeFile.yaml).toEqual(mappedComposeFileMock)
    });
});