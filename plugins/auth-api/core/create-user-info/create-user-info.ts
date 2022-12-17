import { types, Module, DsgContext } from "@amplication/code-gen-types";
import { readFile } from "@amplication/code-gen-utils";
import { interpolate, removeTSClassDeclares } from "../../util/ast";
import { builders, namedTypes } from "ast-types";
import { print } from "recast";
import { getUserIdType } from "../../util/get-user-id-type";

const templatePath = require.resolve("./user-info.template.ts");

export async function createUserInfo(dsgContext: DsgContext): Promise<Module> {
  const { serverDirectories } = dsgContext;
  const authDir = `${serverDirectories.srcDirectory}/auth`;
  const template = await readFile(templatePath);
  const idType = getUserIdType(dsgContext);
  const templateMapping = prepareTemplateMapping(idType);
  const filePath = `${authDir}/UserInfo.ts`;
  interpolate(template, templateMapping);
  removeTSClassDeclares(template);

  return { code: print(template).code, path: filePath };
}

function prepareTemplateMapping(idType: types.Id["idType"]) {
  const number = {
    class: "Number",
    type: "number",
  };

  const string = {
    class: "String",
    type: "string",
  };

  const idTypClassOptions: {
    [key in types.Id["idType"]]: namedTypes.Identifier;
  } = {
    AUTO_INCREMENT: builders.identifier(number.class),
    UUID: builders.identifier(string.class),
    CUID: builders.identifier(string.class),
  };

  /* eslint-disable @typescript-eslint/naming-convention */
  const idTypeTSOptions: {
    [key in types.Id["idType"]]: namedTypes.Identifier;
  } = {
    AUTO_INCREMENT: builders.identifier(number.type),
    UUID: builders.identifier(string.type),
    CUID: builders.identifier(string.type),
  };

  return {
    USER_ID_TYPE_ANNOTATION: idTypeTSOptions[idType],
    USER_ID_CLASS: idTypClassOptions[idType],
  };
}