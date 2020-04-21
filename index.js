'use strict';

class ServerlessPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.provider = 'aws';

    this._beforeDeploy = this.beforeDeploy.bind(this)
    this.hooks = {
      'before:package:finalize': this._beforeDeploy,
    };
  }

  updateCfTemplateFromHttp(eventTypes) {
    if (eventTypes.http) {
      if (eventTypes.http.operationName) {
        const resourceName = this.normalizePath(eventTypes.http.path);
        const methodLogicalId = this.getMethodLogicalId(resourceName, eventTypes.http.method);
        const resource = this.cfTemplate.Resources[methodLogicalId]
        
        resource.Properties.OperationName = eventTypes.http.operationName;
      }
    }
  }

  beforeDeploy() {
    const naming = this.serverless.providers.aws.naming;
    this.getMethodLogicalId = naming.getMethodLogicalId.bind(naming);
    this.normalizePath = naming.normalizePath.bind(naming);

    this.cfTemplate = this.serverless
    .service.provider.compiledCloudFormationTemplate;
    this.serverless.service.getAllFunctions().forEach(functionName => {
      const func = this.serverless.service.getFunction(functionName);
      func.events.forEach(this.updateCfTemplateFromHttp.bind(this));
    });
  }
}

module.exports = ServerlessPlugin;
