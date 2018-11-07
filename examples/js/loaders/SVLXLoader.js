THREE.SVLXloader = function ( manager ) {

	this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

};

THREE.SVLXloader.prototype = {

	constructor: THREE.SVLXloader,
    materialMerge: Array,

    load(url, onLoad, onProgress, onError )
    {
        var scope = this;
        scope.materialMerge = [];
        var loader = new THREE.FileLoader(scope.manager);
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


                //model:instance or model 's attributes
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
                        accessorValues: accessorValues
                    }
					var accessorValue = {
						fileIndex: fileIndex,
						blockOffset: blockOffset,
						blockLength: blockLength
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
                var instances = [];
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
                    var matrix = new THREE.Matrix4();
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

                    instances.push(instance);
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

                            var vertexNum = meshView.getUint32(offset, true);
                            offset += 4;

                            var normalNum = meshView.getUint32(offset, true);
                            offset += 4;

                            var uvNum = meshView.getUint32(offset, true);
                            offset += 4;

                            var edgeNum = meshView.getUint32(offset, true);
                            offset += 4;

                            var faceNum = meshView.getUint32(offset, true);
                            offset += 4;

                            var paddingNum = meshView.getUint32(offset, true);
                            offset += 4;

							//mesh vertex attribute
                            var vertexValues = [];
                            for (var k = 0; k < vertexNum; k++) {
                                var value = meshView.getFloat32(offset, true);
                                offset += 4;
                                vertexValues.push(value);
                            }

                            var normalValues = [];
                            for (var k = 0; k < normalNum; k++) {
                                var value = meshView.getFloat32(offset, true);
                                offset += 4;
                                normalValues.push(value);
                            }

                            var uvValues = [];
                            for (var k = 0; k < uvNum; k++) {
                                var value = meshView.getFloat32(offset, true);
                                offset += 4;

                                //if (k % 3 === 2)
                                //{
                                //    continue;
                                //}
                                uvValues.push(value);
                            }

							var merageFace = true;
							var vertexBA = new THREE.BufferAttribute(new Float32Array(vertexValues), 3);
							var normalBA = new THREE.BufferAttribute(new Float32Array(normalValues), 3);
							var uvBA = new THREE.BufferAttribute(new Float32Array(uvValues), 2);

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

								if(!merageFace){
									//faceGeometry
									//var geometry = constructFaceGeometry(indexs, vertexValues, normalValues, uvValues);
									var geometry = new THREE.BufferGeometry();
									geometry.addAttribute('position',vertexBA );
									geometry.addAttribute('normal', normalBA);

									if (uvValues.length > 0) {
										geometry.addAttribute('uv',uvBA);
									}
									geometry.setIndex(new THREE.BufferAttribute(new Uint16Array (indexs),1));
								}
								else
								{
									if(meshMaterialId ===0){
										meshMaterialId = materialId;
									}
								}


                                var edgeIds = [];
                                //if (edgeIdNum !== 4294967295) {
                                    for (var n = 0; n < edgeIdNum; n++) {
                                        var value = meshView.getUint32(offset, true);
                                        offset += 4;

                                        edgeIds.push(value);
                                    }
                                //}
								if(!merageFace){
									var face = {
										faceId: faceId,
										materialId: materialId,
										indexNum: indexNum,
										edgeIdNum: edgeIdNum,
										indexs: indexs,
										edgeIds: edgeIds,
										geometry: geometry
									}

									faces.push(face);
								}
                            }

							if(merageFace){
								var geometry = new THREE.BufferGeometry();
								geometry.addAttribute('position',vertexBA );
								geometry.addAttribute('normal', normalBA);

								if (uvValues.length > 0) {
									geometry.addAttribute('uv',uvBA);
								}
								geometry.setIndex(new THREE.BufferAttribute(new Uint16Array (meshIndexs),1));

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
                            for (var k = 0; k < edgeNum; k++) {
                                var edgeId = meshView.getUint32(offset, true);
                                offset += 4;

                                var indexNum = meshView.getUint32(offset, true);
                                offset += 4;

                                var indexs = [];
                                //if (indexNum !== 4294967295) {
                                    for (var n = 0; n < indexNum; n++) {
                                        var value = meshView.getUint32(offset, true);
                                        offset += 4;

                                        indexs.push(value);
                                    }
                                //}

                                var edge = {
                                    edgeId: edgeId,
                                    indexNum: indexNum,
                                    indexs: indexs
                                }

                                edges.push(edge);
                            }

                            var paddings = [];
                            for (var k = 0; k < paddingNum; k++) {
                                var value = meshView.getUint32(offset, true);
                                offset += 4;

                                paddings.push(value);
                            }

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
                }

                return { meshObjs: meshObjs };
            }

            //����ÿ��face��geometry
            function constructFaceGeometry(indexs, vertexValues, normalValues, uvValues)
            {
                if ((vertexValues.length === 0) || (normalValues.length === 0)) {
                    return null;
                }

                var hasUV = (uvValues.length > 0);

                var newVertexValues = [];
                var newNormalValues = [];
                var newUVValues = [];
                for (var i = 0; i < indexs.length; i++) {
                    var index = indexs[i];
                    newVertexValues.push(vertexValues[index * 3 + 0]);
                    newVertexValues.push(vertexValues[index * 3 + 1]);
                    newVertexValues.push(vertexValues[index * 3 + 2]);
                    newNormalValues.push(normalValues[index * 3 + 0]);
                    newNormalValues.push(normalValues[index * 3 + 1]);
                    newNormalValues.push(normalValues[index * 3 + 2]);

                    if (hasUV) {
                        newUVValues.push(uvValues[index * 3 + 0]);
                        newUVValues.push(uvValues[index * 3 + 1]);
                    }
                }

                var geometry = new THREE.BufferGeometry();
                geometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(newVertexValues), 3));
                geometry.addAttribute('normal', new THREE.BufferAttribute(new Float32Array(newNormalValues), 3));

                if (newUVValues.length > 0) {
                    geometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(newUVValues), 2));
                }
                return geometry;
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
                var meshGeometrys = initMeshGeometry(svlxData.mesh);

                var models = initModel(svlxData.model, meshGeometrys);

                var instances = initInstance(svlxData.bom, svlxData.model, svlxData.material, models);

                var svlxObj = initSVLXObject(instances);

                return svlxObj;
            }

            //�ļ��ṹ��model-lod-entity-face
			//badsmells
            function initMeshGeometry(mesh)
            {
                var modelGeometrys = [];
                for (var i = 0; i < mesh.meshObjs.length; i++) {
                    var tmpMeshObj = mesh.meshObjs[i];
                    var lodGeometrys = [];
                    for (var j = 0; j < tmpMeshObj.lodMeshs.length; j++) {
                        var lodMesh = tmpMeshObj.lodMeshs[j];
                        var entityGeometrys = [];
                        for (var k = 0; k < lodMesh.meshs.length; k++) {
                            var entityMesh = lodMesh.meshs[k];
                            var faceGeometrys = [];
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
                    var tmpArr = models.filter(function (item, index, models) {
                        return item.id === tmpInstance.modelId;
                    });

                    var mesh = null;
                    var name = "";
                    if (tmpArr.length > 0) {
                        name = tmpArr[0].name;
                        if (tmpArr[0].lodGeometrys.length > 0)
                        {
                            mesh = new THREE.Object3D();
                            //Ĭ�ϼ���lod0����
                            var entityGeometrys = tmpArr[0].lodGeometrys[0].entityGeometrys;

                            for (var j = 0; j < entityGeometrys.length; j++) {
                                var entityGeometry = entityGeometrys[j];
                                for (var k = 0; k < entityGeometry.faceGeometrys.length; k++) {
                                    var faceGeometry = entityGeometry.faceGeometrys[k];

                                    //��ȡ����
                                    var tmpMaterial = creatMaterial(faceGeometry.materialId, tmpInstance.materialId, material);
                                    var geometry = faceGeometry.geometry;

                                    //����mesh
                                    var tmpMesh = new THREE.Mesh(geometry, tmpMaterial.clone());
                                    let newMesh = tmpMesh.clone();
                                    newMesh.applyMatrix(tmpInstance.matrix);
                                    newMesh.updateMatrix();
                                    meshMergeByMaterial(faceGeometry.materialId, newMesh);

                                    mesh.add(tmpMesh);
                                }
                            }
                            mesh.applyMatrix(tmpInstance.matrix);
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

                //���ʵ�����ӹ�ϵ
                for (var i = 0; i < instances.length; i++) {
                    var tmpInstance = instances[i];
                    if (tmpInstance.children === undefined) {
                        tmpInstance.children = [];
                    }
                    //��ȡ��ǰʵ���ĸ�
                    if (tmpInstance.parentId === 4294967295) {
                        tmpInstance.parent = "root";
                    }
                    else {
                        //��ǵ�ǰʵ����
                        var tmpArr = instances.filter(function (item, index, instances) {
                            return item.instanceId === tmpInstance.parentId;
                        });
                        for (var j = 0; j < tmpArr.length; j++) {
                            tmpInstance.parent = tmpArr[j];
                        }
                    }

                    //��ȡ��ǰʵ������
                    var tmpArr = instances.filter(function (item, index, instances) {
                        return item.parentId === tmpInstance.instanceId;
                    });
                    for (var j = 0; j < tmpArr.length; j++) {
                        tmpInstance.children.push(tmpArr[j]);
                    }
                }

                return instances;
            }

            function creatMaterial(faceMaterialId, instanceMaterialId, material) {
                //Ĭ�ϲ���
                var tmpMaterial = new THREE.MeshPhongMaterial({
                    color: 0x5ab8e8,
                    side: THREE.DoubleSide,
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

                    if (tmpMaterialArr !== 0) {
                        var diffuseColor = tmpMaterialArr[0].diffuseColor;
                        for (var i = 0; i < 3; i++) {
                            if (diffuseColor[i] < 0) {
                                diffuseColor[i] = 0.8;
                            }
                        }

                        var color = new THREE.Color(diffuseColor[0], diffuseColor[1], diffuseColor[2]);
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
                    var tmpTree = {
                        label: instance.instanceName,
                        name: instance.instanceId,
                        type: "svlx",
                        children: []
                    }
                    if (instance.parentId === 4294967295) {
                        tree = tmpTree;
                        topInstance = instance;
                    }
                    trees.push(tmpTree);
                }

                for (var i = 0; i < instances.length; i++) {
                    var instance = instances[i];
                    var curTree = trees[i];
                    var tmpChildren = instance.children;
                    for (var j = 0; j < tmpChildren.length; j++) {
                        curTree.children.push(trees[tmpChildren[j].index]);
                    }
                }

                var obj3d = initObject3D(topInstance);

                return { tree: tree, object: obj3d };
            }

            function initObject3D(object) {
                if (object.children.length > 0)
                {
                    var obj3d = new THREE.Object3D();
                    for (var i = 0; i < object.children.length; i++) {
                        var tmpObj3d = initObject3D(object.children[i]);
                        if (tmpObj3d !== null) {
                            obj3d.add(tmpObj3d);
                        }
                    }
                    obj3d.applyMatrix(object.matrix);
                    return obj3d;
                }
                else
                {
                    return object.mesh;
                }
                // var topMesh = new THREE.Mesh();
                // for(var key in scope.materialMerge){
                //     var tempMesh = new THREE.Mesh();
                //     for(var subMesh of scope.materialMerge[key]){
                //         tempMesh.geometry.merge(subMesh.geometry);
                //     }
                //     topMesh.children.push(tempMesh);
                // }
                // return topMesh;
            }

			//parse function
            var svlxData = loadDocument(data);
            var svlObj = init(svlxData);
            
            return svlObj;
        }
    }

     
}