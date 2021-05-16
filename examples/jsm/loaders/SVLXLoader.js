import {
	BufferGeometry,
	Float32BufferAttribute,
	Group,
	LineBasicMaterial,
	LineSegments,
	Loader,
	Material,
	Mesh,
	MeshPhongMaterial,
	Points,
	PointsMaterial,
    Vector3,
    FileLoader,
    Object3D,
    Matrix4,
    BufferAttribute,
    DoubleSide,
    Color,
    InstancedMesh,
    DynamicDrawUsage,
    StaticDrawUsage,
    MeshNormalMaterial

} from "../../../build/three.module.js";

import {JSZip} from "./jszip/jszip.min.js"

var SVLXloader = ( function () {

    var SVLXloader = function ( manager ) {
        Loader.call( this, manager );
    };

    SVLXloader.prototype = {

        constructor: SVLXloader,
        materialMerge: Array,

        load(url, onLoad, onProgress, onError )
        {
            var scope = this;
            scope.materialMerge = [];
            var loader = new FileLoader(scope.manager);
            loader.setResponseType('arraybuffer');
            loader.load(url, function (text) {
                var svlObj = parse(text);
                onLoad(svlObj);
            }, onProgress, onError);


            function parse(data)
            {
                function loadDocument(data) {
                    var view = new DataView(data);
                    var zip = null;
                    var file = null;

                    var info = null;
                    var bom = null;
                    var animation = "";
                    var model = null;
                    var material = null;
                    var lod = null;
                    var mesh = null;
                    var geo = null;
                    var pmi = null;

                    try {
                        zip = new JSZip(data);
                    } catch (e) {
                        if (e instanceof ReferenceError) {
                            console.log('	jszip missing and file is compressed.');
                            return null;
                        }
                    }

                    //info
                    var infoFileName = /\.info$/i;
                    var infoStr = zip.file(infoFileName);
                    if (infoStr && infoStr.length > 0)
                    {
                        info = parseInfo(infoStr[0].asText());
                    }


                    //animation
                    //var animationFile = new RegExp('.*.' + 'animation' + '$', 'i');
                    //var animationStr = zip.file(animationFile);
                    //animation = parseAnimation(animationStr[0].asText());

                    //bom 
                    /* {instanceId,
                        parentId,
                        modelId,
                        plcId,
                        visible,
                        materialId,
                        matrix
                        }
                    */
                    var bomFile = new RegExp('.*.' + 'bom' + '$', 'i');
                    var bomStr = zip.file(bomFile);
                    if (bomStr && bomStr.length > 0)
                    {
                        bom = parseBom(bomStr[0].asArrayBuffer());
                    }


                    //model:instance or model's attributes
                    var modelFile = new RegExp('.*.' + 'model' + '$', 'i');
                    var modelStr = zip.file(modelFile);
                    if (modelStr && modelStr.length > 0)
                    {
                        model = parseModel(modelStr[0].asText());
                    }


                    //material
                    var materialFile = new RegExp('.*.' + 'material' + '$', 'i');
                    var materialStr = zip.file(materialFile);
                    if (materialStr && materialStr.length > 0)
                    {
                        material = parseMaterial(materialStr[0].asText());
                    }


                    //lod
                    /*lodObj = {
                            modelId: modelId,
                            bbox: bboxValues,
                            numLod: numLod,
                            accessorValues[]:[
                                accessorValue = {
                                    fileIndex: fileIndex,
                                    blockOffset: blockOffset,
                                    blockLength: blockLength
                                }
                            ]
                        }
                    */
                    var lodFile = new RegExp('.*.' + 'lod' + '$', 'i');
                    var lodStr = zip.file(lodFile);
                    if (lodStr && lodStr.length > 0)
                    {
                        lod = parseLod(lodStr[0].asArrayBuffer());
                    }


                    //mesh
                    var meshFile = new RegExp('.*.' + 'mesh' + '$', 'i');
                    var meshStr = zip.file(meshFile);
                    if (meshStr && meshStr.length > 0)
                    {
                        mesh = parseMesh(meshStr[0].asArrayBuffer(), lod);
                    }


                    //geo
                    var geoFile = new RegExp('.*.' + 'geo' + '$', 'i');
                    var geoStr = zip.file(geoFile);
                    if (geoStr && geoStr.length > 0)
                    {
                        geo = parseGeo(geoStr[0].asText());
                    }


                    //pmi
                    var pmiFile = new RegExp('.*.' + 'pmi' + '$', 'i');
                    var pmiStr = zip.file(pmiFile);
                    if (pmiStr && pmiStr.length > 0)
                    {
                        pmi = parsePmi(pmiStr[0].asText());
                    }
                    var svlData = {
                        info: info,
                        bom: bom,
                        animation: animation,
                        model: model,
                        material: material,
                        lod: lod,
                        mesh: mesh,
                        geo: geo,
                        pmi: pmi
                    }

                    return svlData;
                }

                function parseInfo(data) {
                    var infoObj = JSON.parse(data);
                    var infoNodeObj = infoObj.info;
                    if (infoNodeObj)
                    {
                        var sceneNodeObj = infoNodeObj.scene;
                    }
                    return infoNodeObj;
                }

                function parseAnimation(data) {
                    var animationObj = JSON.parse(data);

                    return animationObj;
                }

                function parseBom(data) {
                    var bomView = new DataView(data);
                    var length = bomView.byteLength;
                    var offset = 0;
                    var instances = {};
                    while (offset < length)
                    {
                        var instanceId = bomView.getUint32(offset, true);
                        offset += 4;

                        var parentId = bomView.getUint32(offset, true);
                        offset += 4;

                        var modelId = bomView.getUint32(offset, true);
                        offset += 4;

                        var plcId = bomView.getUint32(offset, true);
                        offset += 4;

                        var visible = bomView.getUint32(offset, true);
                        offset += 4;

                        var materialId = bomView.getUint32(offset, true);
                        offset += 4;

                        var values = [];
                        for (var i = 0; i < 16; i++) {
                            var value = bomView.getFloat32(offset, true);
                            values.push(value);
                            offset += 4;
                        }
                        var matrix = new Matrix4();
                        matrix.set(
                            values[0], values[1], values[2], values[3],
                            values[4], values[5], values[6], values[7],
                            values[8], values[9], values[10], values[11],
                            values[12], values[13], values[14], values[15]
                        );

                        var instance = {
                            instanceId: instanceId,
                            parentId: parentId,
                            modelId: modelId,
                            plcId: plcId,
                            visible: visible,
                            materialId: materialId,
                            matrix: matrix
                        }

                        instances[instanceId] =instance;
                    }

                    return { instances: instances };
                }

                function parseModel(data) {
                    var modelObj = JSON.parse(data);

                    return modelObj;
                }

                function parseMaterial(data) {
                    var materialObj = JSON.parse(data);

                    return materialObj;
                }

                /*
                LOD
                [
                    modelID,            //1 uint32 = 4bytes
                    bboxValues,         //6 float = 24bytes
                    numLod,             //1 uint32 = 4bytes
                    accessorValues:[
                    {
                        fileIndex,      //1 uint32 = 4bytes
                        blockOffset,    //1 uint32 = 4bytes
                        blockLength,    //1 uint32 = 4bytes
                     }...],
                ]
                 */

                function parseLod(data) {
                    var lodView = new DataView(data);
                    var length = lodView.byteLength;
                    var offset = 0;
                    var lodObjs = [];
                    while (offset < length){
                        var modelId = lodView.getUint32(offset, true);
                        offset += 4;

                        var bboxValues = [];
                        for (var i = 0; i < 6; i++) {
                            var value = lodView.getFloat32(offset, true);
                            offset += 4;
                            bboxValues.push(value);
                        }

                        var numLod = lodView.getUint32(offset, true);
                        offset += 4;

                        var accessorValues = [];
                        for (var i = 0; i < numLod; i++) {
                            var fileIndex = lodView.getUint32(offset, true);
                            offset += 4;

                            var blockOffset = lodView.getUint32(offset, true);
                            offset += 4;

                            var blockLength = lodView.getUint32(offset, true);
                            offset += 4;

                            var accessorValue = {
                                fileIndex: fileIndex,
                                blockOffset: blockOffset,
                                blockLength: blockLength
                            }

                            accessorValues.push(accessorValue);
                        }

                        var lodObj = {
                            modelId: modelId,
                            bbox: bboxValues,
                            numLod: numLod,
                            accessorValues: accessorValues
                        }
                        lodObjs.push(lodObj);
                    }

                    return { lods: lodObjs };
                }

                /**
                meshObjs[
                    meshObj = {
                        modelId:modelId,
                        lodMeshs[numLod]:[
                            lodMesh:{
                                fileIndex,
                                meshs[ 
                                    mesh = {
                                        meshId: meshId,
                                        edgeNum: edgeNum,
                                        faceNum: faceNum,
                                        paddingNum: paddingNum,
                                        faces[1]: [         //count=1 when merageFace == true
                                            face:{
                                                faceId: 0,
                                                materialId: meshMaterialId,
                                                indexNum: meshIndexs.length,
                                                edgeIdNum: 0,
                                                indexs: meshIndexs,
                                                edgeIds: null,
                                                geometry: geometry
                                            }
                                        ]
                                        ,
                                        edges: edges,
                                        paddings: paddings,
                                        //geometry: geometry
                                    },...
                                ]
                            },...
                        ],
                    },...
                ] 
                 */
                function parseMesh(data, lod) {
                    var meshView = new DataView(data);
                    var length = meshView.byteLength;
                    var offset = 0;

                    var meshObjs = [];
                    
                    for (var i = 0; i < lod.lods.length; i++) {
                       var numLod = lod.lods[i].numLod;

                        if (numLod === 0)
                        {
                            continue;
                        }
                        if(numLod>1)
                        { 
                            console.log("LOD is :"+ munLod);
                        }
                        
                        var lodMeshs = [];
                        for (var j = 0; j < numLod; j++)
                        {
                            var accessorValue = lod.lods[i].accessorValues[j];
                            var tmpLength = accessorValue.blockLength;
                            var tmpOffset = accessorValue.blockOffset;

                            var meshs = [];
                            while (offset < (tmpOffset + tmpLength)) {
                                var meshId = meshView.getUint32(offset, true);
                                offset += 4;

                                //vertexNum = vertex count * 3
                                var vertexNum = meshView.getUint32(offset, true);
                                offset += 4;

                                //normalNum = normal count * 3
                                var normalNum = meshView.getUint32(offset, true);
                                offset += 4;

                                //uvNum = uv count * 2
                                var uvNum = meshView.getUint32(offset, true);
                                offset += 4;

                                var edgeNum = meshView.getUint32(offset, true);
                                offset += 4;

                                var faceNum = meshView.getUint32(offset, true);
                                offset += 4;

                                var paddingNum = meshView.getUint32(offset, true);
                                offset += 4;

                                //mesh vertex attribute

                                let vertexArray = new Float32Array(data,offset,vertexNum);
                                offset += vertexNum * 4;

                                let normalArray = new Float32Array(data, offset, normalNum);
                                offset += 4 * normalNum;

                                let uvArray = new Float32Array(data, offset, uvNum);
                                offset += 4 * uvNum;

                                var merageFace = true;

                                var vertexBA = new BufferAttribute(vertexArray, 3);
                                var normalBA = new BufferAttribute(normalArray, 3);
                                var uvBA = new BufferAttribute(uvArray, 2);

                                var meshIndexs = [];
                                var faces = [];
                                var meshMaterialId = 0;

                                for (var k = 0; k < faceNum; k++) {
                                    var faceId = meshView.getUint32(offset, true);
                                    offset += 4;

                                    var materialId = meshView.getUint32(offset, true);
                                    offset += 4;

                                    var indexNum = meshView.getUint32(offset, true);
                                    offset += 4;

                                    var edgeIdNum = meshView.getUint32(offset, true);
                                    offset += 4;

                                    var indexs = [];
                                    //if (indexNum !== 4294967295) {
                                        for (var n = 0; n < indexNum; n++) {
                                            var value = meshView.getUint32(offset, true);
                                            offset += 4;

                                            indexs.push(value);
                                            if(merageFace){
                                                meshIndexs.push(value);
                                            }
                                        }
                                    //}

                                    // if(!merageFace){
                                    //     //faceGeometry
                                    //     //var geometry = constructFaceGeometry(indexs, vertexValues, normalValues, uvValues);
                                    //     var geometry = new BufferGeometry();
                                    //     geometry.setAttribute('position',vertexBA );
                                    //     geometry.setAttribute('normal', normalBA);

                                    //     if (uvValues.length > 0) {
                                    //         geometry.setAttribute('uv',uvBA);
                                    //     }
                                    //     geometry.setIndex(new BufferAttribute(new Uint16Array (indexs),1));
                                    // }
                                    // else
                                    // {
                                    //     if(meshMaterialId ===0){
                                    //         meshMaterialId = materialId;
                                    //     }
                                    // }


                                    var edgeIds = [];
                                    //don't use edge
                                    // //if (edgeIdNum !== 4294967295) {
                                    //     for (var n = 0; n < edgeIdNum; n++) {
                                    //         var value = meshView.getUint32(offset, true);
                                    //         offset += 4;

                                    //         edgeIds.push(value);
                                    //     }
                                    // //}
                                    offset += edgeIdNum * 4;

                                    // if(!merageFace){
                                    //     var face = {
                                    //         faceId: faceId,
                                    //         materialId: materialId,
                                    //         indexNum: indexNum,
                                    //         edgeIdNum: edgeIdNum,
                                    //         indexs: indexs,
                                    //         edgeIds: edgeIds,
                                    //         geometry: geometry
                                    //     }

                                    //     faces.push(face);
                                    // }
                                }

                                if(merageFace){
                                    var geometry = new BufferGeometry();
                                    geometry.setAttribute('position',vertexBA );
                                    geometry.setAttribute('normal', normalBA);

                                    if (uvArray.length > 0) {
                                        geometry.setAttribute('uv',uvBA);
                                    }
                                    geometry.setIndex(new BufferAttribute(new Uint16Array (meshIndexs),1));

                                    var face = {
                                        faceId: 0,
                                        materialId: meshMaterialId,
                                        indexNum: meshIndexs.length,
                                        edgeIdNum: 0,
                                        indexs: meshIndexs,
                                        edgeIds: null,
                                        geometry: geometry
                                    }

                                    faces.push(face);
                                }

                                var edges = [];
                                //don't use ,but can't jump over this without read it! Bad smell!
                                for (var k = 0; k < edgeNum; k++) {
                                    var edgeId = meshView.getUint32(offset, true);
                                    offset += 4;

                                    var indexNum = meshView.getUint32(offset, true);
                                    offset += 4;

                                    var indexs = [];
                                    // //if (indexNum !== 4294967295) {
                                    //     for (var n = 0; n < indexNum; n++) {
                                    //         var value = meshView.getUint32(offset, true);
                                    //         offset += 4;

                                    //         indexs.push(value);
                                    //     }
                                    // //}
                                    offset += indexNum * 4;

                                    // var edge = {
                                    //     edgeId: edgeId,
                                    //     indexNum: indexNum,
                                    //     indexs: indexs
                                    // }

                                    // edges.push(edge);
                                }

                                var paddings = [];
                                //don't use it.
                                // for (var k = 0; k < paddingNum; k++) {
                                //     var value = meshView.getUint32(offset, true);
                                //     offset += 4;

                                //     paddings.push(value);
                                // }
                                offset += paddingNum * 4;

                                var mesh = {
                                    meshId: meshId,
                                    edgeNum: edgeNum,
                                    faceNum: faceNum,
                                    paddingNum: paddingNum,
                                    faces: faces,
                                    edges: edges,
                                    paddings: paddings,
                                    //geometry: geometry
                                }

                                meshs.push(mesh);
                            }

                            var lodMesh = {
                                fileIndex: accessorValue.fileIndex,
                                meshs: meshs
                            }
                            lodMeshs.push(lodMesh);
                        }

                        var meshObj = {
                            modelId: lod.lods[i].modelId,
                            lodMeshs: lodMeshs
                        }

                        meshObjs.push(meshObj);
                    } //for (var i = 0; i < lod.lods.length; i++) {

                    return { meshObjs: meshObjs };
                }


                function parseMaterial(data) {
                    var materialObj = JSON.parse(data);
                    return materialObj;
                }

                function parseGeo(data) {
                    var goObj = JSON.parse(data);
                    return goObj;
                }

                function parsePmi(data) {
                    var pmiObj = JSON.parse(data);
                    return pmiObj;
                }

                function init(svlxData) {
                    // var meshGeometrys = initMeshGeometry(svlxData.mesh);

                    // var models = initModel(svlxData.model, meshGeometrys);

                    // var instances = initInstance(svlxData.bom, svlxData.model, svlxData.material, models);

                    // var svlxObj = initSVLXObject(instances);

                    // return svlxObj;

                    return initThreeOjbect(svlxData);

                }

                //�ļ��ṹ��model-lod-entity-face
                //badsmells
                function initMeshGeometry(mesh)
                {
                    var modelGeometrys = [];

                    console.log("mesh.meshObjs.length:" + mesh.meshObjs.length);
                    for (var i = 0; i < mesh.meshObjs.length; i++) {
                        var tmpMeshObj = mesh.meshObjs[i];
                        var lodGeometrys = [];

                        //console.log("tmpMeshObj.lodMeshs.length:" + tmpMeshObj.lodMeshs.length);
                        for (var j = 0; j < tmpMeshObj.lodMeshs.length; j++) {
                            var lodMesh = tmpMeshObj.lodMeshs[j];
                            var entityGeometrys = [];

                            //console.log("lodMesh.meshs.length:" + lodMesh.meshs.length);
                            for (var k = 0; k < lodMesh.meshs.length; k++) {
                                var entityMesh = lodMesh.meshs[k];
                                var faceGeometrys = [];

                                //console.log("entityMesh.faces.length:" + entityMesh.faces.length);
                                for (var n = 0; n < entityMesh.faces.length; n++) {
                                    var face = entityMesh.faces[n];
                                    var faceGeometry = {
                                        geometry: face.geometry,
                                        faceId: face.faceId,
                                        materialId: face.materialId
                                    }
                                    faceGeometrys.push(faceGeometry);
                                }
                                entityGeometrys.push({ faceGeometrys: faceGeometrys });
                            }
                            lodGeometrys.push({ entityGeometrys: entityGeometrys });
                        }
                        var modelGeometry = {
                            modelId: tmpMeshObj.modelId,
                            lodGeometrys: lodGeometrys
                        }

                        modelGeometrys.push(modelGeometry);
                    }

                    return modelGeometrys;
                }

                function initModel(model, meshGeometrys)
                {
                    var models = [];
                    for (var i = 0; i < model.models.length; i++) {
                        var tmpModel = model.models[i];
                        
                        var tmpArr = meshGeometrys.filter(function (item, index, meshGeometrys) {
                            return item.modelId === tmpModel.id;
                        });

                        var lodGeometrys = [];
                        if (tmpArr.length !== 0) {
                            lodGeometrys = tmpArr[0].lodGeometrys;
                        }

                        var tmpModel = {
                            id: tmpModel.id,
                            name: tmpModel.name,
                            lodGeometrys: lodGeometrys
                        }

                        models.push(tmpModel);
                    }

                    return models;
                }
                function meshMergeByMaterial (materialID, mesh){
                    var materialIDArr = scope.materialMerge[materialID.toString()];
                    if(!materialIDArr){
                        materialIDArr = [];
                        scope.materialMerge[materialID.toString()] = materialIDArr;
                    }
                    materialIDArr.push(mesh);
                }
                function initInstance(bom, model, material, models)
                {
                    var instances = [];
                    //����ʵ��mesh
                    for (var i = 0; i < bom.instances.length; i++) {
                        var tmpInstance = bom.instances[i];

                        //��ȡgeometry
                        var tmpModelArray = models.filter(function (item, index, models) {
                            return item.id === tmpInstance.modelId;
                        });

                        var mesh = null;
                        var name = "";
                        if (tmpModelArray.length > 0) {
                            name = tmpModelArray[0].name;
                            if (tmpModelArray[0].lodGeometrys.length > 0)
                            {
                                mesh = new Object3D();
                                //Ĭ�ϼ���lod0����
                                var entityGeometrys = tmpModelArray[0].lodGeometrys[0].entityGeometrys;

                                for (var j = 0; j < entityGeometrys.length; j++) {
                                    var entityGeometry = entityGeometrys[j];
                                    for (var k = 0; k < entityGeometry.faceGeometrys.length; k++) {
                                        var faceGeometry = entityGeometry.faceGeometrys[k];

                                        //��ȡ����
                                        var tmpMaterial = creatMaterial(faceGeometry.materialId, tmpInstance.materialId, material);
                                        var geometry = faceGeometry.geometry;

                                        //����mesh
                                        var tmpMesh = new Mesh(geometry, tmpMaterial.clone());
                                        let newMesh = tmpMesh.clone();
                                        newMesh.applyMatrix4(tmpInstance.matrix);
                                        newMesh.updateMatrix();
                                        meshMergeByMaterial(faceGeometry.materialId, newMesh);

                                        mesh.add(tmpMesh);
                                    }
                                }
                                mesh.applyMatrix4(tmpInstance.matrix);
                                mesh.updateMatrix();
                            }
                        }

                        var instance = {
                            instanceId: tmpInstance.instanceId,
                            instanceName: name,
                            parentId: tmpInstance.parentId,
                            plcId: tmpInstance.plcId,
                            visible: tmpInstance.visible,
                            index: i,
                            matrix: tmpInstance.matrix,
                            mesh: mesh
                        }

                        instances.push(instance);
                    }

                    //set children of instances
                    for (var i = 0; i < instances.length; i++) {
                        var tmpInstance = instances[i];
                        if (tmpInstance.children === undefined) {
                            tmpInstance.children = [];
                        }

                        //set children
                        var tmpModelArray = instances.filter(function (item, index, instances) {
                            return item.parentId === tmpInstance.instanceId;
                        });
                        for (var j = 0; j < tmpModelArray.length; j++) {
                            tmpInstance.children.push(tmpModelArray[j]);
                        }
                    }

                    return instances;
                }

                function creatMaterial(faceMaterialId, instanceMaterialId, material) {
                    //Ĭ�ϲ���
                    var tmpMaterial = new MeshPhongMaterial({
                        color: 0x5ab8e8,
                        side: DoubleSide,
                        polygonOffset: true,
                        polygonOffsetFactor: 1,
                        polygonOffsetUnits: 0.05
                    });

                    var id = 0;
                    if (instanceMaterialId != 4294967295) {
                        id = instanceMaterialId;
                    }
                    else if (faceMaterialId != 4294967295) {
                        id = faceMaterialId;
                    }
                    else {
                        id = 4294967295;
                    }

                    if (id !== 4294967295) {
                        var materials = material.materials;
                        var tmpMaterialArr = materials.filter(function (item, index, materials) {
                            return item.id === id;
                        });

                        if (tmpMaterialArr.length !== 0) {
                            var diffuseColor = tmpMaterialArr[0].diffuseColor;
                            for (var i = 0; i < 3; i++) {
                                if (diffuseColor[i] < 0) {
                                    diffuseColor[i] = 0.8;
                                }
                            }

                            var color = new Color(diffuseColor[0], diffuseColor[1], diffuseColor[2]);
                            tmpMaterial.color.set(color);
                        }
                    }

                    return tmpMaterial;
                }

                function initSVLXObject(instances)
                {
                    var tree = null;
                    var topInstance = null;
                    var trees = [];
                    for (var i = 0; i < instances.length; i++) {
                        var instance = instances[i];
                        if (instance.parentId === 4294967295) {
                            // tree = tmpTree;
                            topInstance = instance;
                            break;
                        }
                    }

                    var obj3d = initObject3D(topInstance);

                    return { tree: tree, object: obj3d };
                }

                function initObject3D(object) {
                    if (object.children.length > 0)
                    {
                        var obj3d = new Object3D();
                        for (var i = 0; i < object.children.length; i++) {
                            var tmpObj3d = initObject3D(object.children[i]);
                            if (tmpObj3d !== null) {
                                obj3d.add(tmpObj3d);
                            }
                        }
                        obj3d.applyMatrix4(object.matrix);
                        return obj3d;
                    }
                    else
                    {
                        return object.mesh;
                    }
                }

                //将instances 列表变为树形 2.设置世界矩阵 

                function InstanceArrayToTree(instanceMap){
                    console.log("InstanceArrayToTree begin.");
                    var root = {};
                    root.instanceId = 4294967295;
                    root.matrix = new Matrix4();
                    root.worldMatrix = new Matrix4();
                    root.children = [];
                    //console.log("ins count:",Object.keys(instanceMap).length);
                    for( var id in instanceMap){
                        var child = instanceMap[id];

                        //var parentName = "";
                        if(child.parentId ==4294967295) {
                            root.children.push(child);
                            child.parent = root;

                            //parentName = child.parentId;
                        }
                        else{
                            var parent = instanceMap[child.parentId];
                            if(parent){
                                if(parent.children == null){
                                    parent.children = [];
                                }
                                parent.children.push(child);
                                child.parent = parent;

                                //parentName = child.parentId;//parent.instanceName;
                            } else {

                                //parentName = "not find parent:" +child.parentId;;
                            }
                        }
                        //console.log("ins name:" + id + " parent:" + parentName);
                    }

                    console.log("InstanceArrayToTree end.");
                    return root;
                }

                var sequenceId = 0;
                function updateWorldMatrix(instance,level){
                    sequenceId ++;
                    level++;

                    instance.worldMatrix = instance.matrix.clone();

                    //var parentId = "";
                    if(instance.parent){
                        instance.worldMatrix.premultiply(instance.parent.worldMatrix);
                        //parentId = instance.parent.instanceId;
                    }else{
                        //parentId = "no parent.";
                    }

                    var matChanded = true;
                    if(instance.worldMatrix.equals(instance.matrix)){
                        matChanded = false;
                    }
                    // console.log("seq:" + sequenceId + " level:" + level +" curIns :",instance.instanceId +" parent:" + parentId +" mat change:"+matChanded);
                    // console.log("localMatrix:" + instance.matrix.elements);
                    // console.log("worldMatrix:" + instance.worldMatrix.elements);

                    if(instance.children){
                        for(var i=0;i< instance.children.length;i++){
                            var child = instance.children[i];
                            updateWorldMatrix(child,level);
                        }

                    }
                }

                function initThreeOjbect(svlxData){
                    var root = new Object3D();

                    var material = new MeshPhongMaterial();
                    // material.transparent = true;
                    // material.opacity = 0.5;
                    // get material map
                    var materials = {};
                    var tmpMaterial = null;
                    for(var i = 0; i < svlxData.material.materials.length; i++){
                        tmpMaterial = svlxData.material.materials[i];
                        materials[tmpMaterial.id] = tmpMaterial;
                    }

                    //setup instance world matrix
                    //traverseInstance(svlxData.bom.instances,4294967295,new Matrix4(),null);
                    var rootIns = InstanceArrayToTree(svlxData.bom.instances);

                    console.log("updateWorldMatrix begin.");
                    updateWorldMatrix(rootIns,0);
                    console.log("updateWorldMatrix end.");

                    console.log("svlMesh count:" + svlxData.mesh.meshObjs.length + " instanceCount:" + Object.keys(svlxData.bom.instances).length);

                    //mesh with world matrix
                    for(var i = 0;i<svlxData.mesh.meshObjs.length;i++)
                    {
                        var svlMesh = svlxData.mesh.meshObjs[i];

                        // var svlInstances = svlxData.bom.instances.filter(function (item, index, meshGeometrys) {
                        //     return item.modelId === svlMesh.modelId;
                        // });
                        var svlInstancesByModelId = [];
                        for(var id in svlxData.bom.instances){
                            var curInstance = svlxData.bom.instances[id];
                            if(curInstance.modelId == svlMesh.modelId){
                                svlInstancesByModelId.push(curInstance);
                            }
                        }

                        var count = svlInstancesByModelId.length;
                        var curFace = svlMesh.lodMeshs[0].meshs[0].faces[0];
                        var geometry = curFace.geometry;
                        //var vertexBA = geometry.getAttribute ("position");
                        var curColor = null;
                        var curSVLMaterial = materials[curFace.materialId];
                        if(curSVLMaterial){
                            curColor = new Color(curSVLMaterial.diffuseColor[0],
                                curSVLMaterial.diffuseColor[1],
                                curSVLMaterial.diffuseColor[2],);
                            console.log("FaceColor:" +"r:"  + curColor.r + " g:" + curColor.g + " b:" + curColor.b);
                        }

                        //debug
                        //var strVertx = "x:"  + vertexBA.array[0] + " y:" + vertexBA.array[1] + " z:" + vertexBA.array[2];
                        //console.log("svlMesh ID:" + svlMesh.modelId +" geoIndex:" + geometry.getIndex().count 
                        // //+ " geofirstVertx " + strVertx 
                        // + " instanceCount:" + count);
                        
                        //test normal mesh
                        //const mesh = new Mesh( geometry, material );

                        //instancedMesh
                        var mesh = new InstancedMesh( geometry, material, count );
                        //mesh.castShadow = true;

                        //set matrixs
                        mesh.instanceMatrix.setUsage( StaticDrawUsage ); //  DynamicDrawUsage - will be updated every frame 
                        //const matIdent = new Matrix4();

                        //set colors
                        //mesh.instanceColor.setUsage( DynamicDrawUsage ); // will be updated every frame
                        
                        //loop each instance of prototype
                        for( var j = 0;j<count;j++){
                            mesh.setMatrixAt(j,svlInstancesByModelId[j].worldMatrix);//worldMatrix//matrix

                            var curInstanceMaterial = materials[svlInstancesByModelId[j].materialId];
                            if(curInstanceMaterial){
                                curColor = new Color(curInstanceMaterial.diffuseColor[0],
                                    curInstanceMaterial.diffuseColor[1],
                                    curInstanceMaterial.diffuseColor[2],);
                            }
                            if(!curColor){
                                curColor = new Color(1,0,0);
                            }
                            var curColor = new Color(Math.random(), Math.random(), Math.random());
                            mesh.setColorAt(j,curColor);
                        }
                        
                        root.add( mesh );
                    }
                    return root;
                }

                //parse function
                var svlxData = loadDocument(data);
                var svlObj = init(svlxData);
                
                return svlObj;
            }
        }
    }

    return SVLXloader;
})();

export { SVLXloader };