import yaml from 'js-yaml';
import fs from 'fs';
import deepmerge from 'deepmerge'
import { SIGUNUSED } from 'constants';

export default class DockerComposeFile {
    /**
     * Creates a DockerComposeFile instance with provided docker-compose.yml file or string.
     * @param {String} composeFileString Either a path to a docker-compose.yml file or a yaml string.
     */
    constructor(...composeFiles) {
        this.add(...composeFiles);
    }

    /**
     * Merges the provided compose files.
     * @param composeFiles Any number of compose file paths or DockerComposeFile objects.
     */
    add(...composeFiles) {
        for(let i = 0; i < composeFiles.length; i++) {
            let composeFile = composeFiles[i];
            
            if (composeFile instanceof DockerComposeFile) {
                composeFile = composeFile.yaml;
            } else if (composeFile?.includes('.yml')) {
                composeFile = fs.readFileSync(composeFile, 'utf8').trim();
            }

            this.yaml = yaml.load(composeFile);
        }
    }

    /**
     * Merges the new yaml to the current DockerComposeFile
     */
    set yaml(yamlObject) {
        this.yamlObject = deepmerge(this.yamlObject, yamlObject, { 
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

    /**
     * Returns a yaml document.
     */
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
     * Takes a template and generates an array of substituted docker compose files.
     * @param substitutions Any number of arrays of template string in position one and an array of substitutions in position two. 
     * @returns Array of substituted docker compose files.
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
