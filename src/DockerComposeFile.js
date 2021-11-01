const yaml = require('js-yaml');
const fs = require('fs');
const deepmerge = require('deepmerge');

/**
 * Docker Compose File class.  
 * Represents the yaml object of a docker-compose file.  
 * Allows for merging and mapping of compose files.  
 */
class DockerComposeFile {
    /**
     * Creates a DockerComposeFile instance with provided docker-compose.yml file or string.
     * @param {String|DockerComposeFile} composeFileString a path to a docker-compose.yml file, a full yaml string or a DockerComposeFile instance.
     * @example
     * const composeFile = new DockerComposeFile(`${__dirname}/docker-compose.yml`);
     * @example
     * const composeFile = new DockerComposeFile(`${__dirname}/docker-compose.yml`, `${__dirname}/docker-compose.vpn.yml`);
     * @example 
     * const composeFile = new DockerComposeFile(`${__dirname}/docker-compose.yml, "version: '3'");
     * @returns {DockerComposeFile} DockerComposeFile instance with all files or strings merged together.
     */
    constructor(...composeFiles) {
        this.add(...composeFiles);
    }

    /**
     * Merges the provided compose files into the current yaml class object.
     * @param {String|DockerComposeFile} composeFiles Any number of compose file paths or DockerComposeFile objects.
     * @returns {String} Merged yaml string.
     */
    add(...composeFiles) {
        for(let i = 0; i < composeFiles.length; i++) {
            let composeFile = composeFiles[i];
            
            if (composeFile instanceof DockerComposeFile) {
                composeFile = composeFile.yaml;
            } else if (composeFile?.includes('.yml')) {
                composeFile = fs.readFileSync(composeFile, 'utf8').trim();
            }

            this.yamlObject = deepmerge(this.yamlObject, yaml.load(composeFile), { 
                arrayMerge: (target, source, options) => {
                    function onlyUnique(value, index, self) {
                        return self.indexOf(value) === index;
                    }
                    
                    return target.concat(source).filter(onlyUnique).map(function(element) {
                        return options.cloneUnlessOtherwiseSpecified(element, options)
                    })
                }
            });
        }
        return this.yaml;
    }

    /**
     * Merges the new yaml string to the current yaml also takes file paths or DockerComposeFiles.
     * @type {String}
     */
    set yaml(yamlString) {
        return this.add(yamlString);
    }

    get yaml() {
        return yaml.dump(this.yamlObject, {'sortKeys': true}).trim();
    }

    /**
     * Save the yaml file to disk.
     * @param path File path to save the yaml.
     */
    write(path) {
        fs.writeFileSync(path, this.yaml);
    }

    /**
     * Takes a docker-compose file with template strings and generates an array of substituted docker compose files.
     * Only operates with arrays of substitutions of the same length.
     * @param {Array<String, Array<String>>} substitutions Each set of substitutions an key and an array of values to map.
     * @example
     * // docker-compose file containing template strings for ${REGION} and ${ID}.
     * const yamlString = 
     * `
     * services:
     *   vpn-${REGION}-${ID}:
     *     container_name: 'vpn-${REGION}-${ID}'
     *     environment:
     *       - REGION=${REGION}
     * `;
     * const composeFileTemplate = new DockerComposeFile(yamlString);
     * // Will return a array of 2 compose files for each substitution.
     * const composeFiles = composeFileTemplate.mapTemplate(
     *    ['REGION', ['US_West', 'US_Seattle']],
     *    ['ID', ['1', '2']]
     * );
     * @returns Array of substituted docker compose files.
     * @todo allow for variable length substitutions.
     */
    mapTemplate(...substitutions) {
        let composeTemplate = this.yaml;
        let composeFiles = [];
        while(substitutions.length) {
            let [stringTemplate, subs] = substitutions.pop();
            for (let i = 0; i < subs.length; i++) {
                if (composeFiles[i] === undefined) {
                    composeFiles[i] = composeTemplate;
                }
                composeFiles[i] = composeFiles[i].replaceAll('${' + stringTemplate +'}', subs[i]);
            } 
        }
        return composeFiles.map((file) => new DockerComposeFile(file));
    }
}


module.exports = DockerComposeFile;