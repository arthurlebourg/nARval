// @ts-ignore
import { addEntity, IWorld, Types, defineComponent, addComponent } from 'bitecs';
import { Object3D } from 'three';

const { f32, ui32, ui8 } = Types;

const Vector3Schema = { x: f32, y: f32, z: f32 }
const QuaternionSchema = { x: f32, y: f32, z: f32, w: f32 }

const TransformSchema = {
    position: Vector3Schema,
    rotation: QuaternionSchema,
    scale: Vector3Schema,
}

type Vector3Component = {
    x: Float32Array
    y: Float32Array
    z: Float32Array
}

type QuaternionComponent = {
    x: Float32Array
    y: Float32Array
    z: Float32Array
    w: Float32Array
}

type TransformComponentType = {
    position: Vector3Component,
    rotation: QuaternionComponent,
    scale: Vector3Component,
}

export const TransformComponent = defineComponent<TransformComponentType>(TransformSchema)

const NetworkedSchema = {
    id: ui32,
    owner: ui8,
    ownership_transfer: ui8,
}

type NetworkedComponentType = {
    id: Uint32Array,
    owner: Uint8Array,
    ownership_transfer: Uint8Array,
}

export const NetworkedComponent = defineComponent<NetworkedComponentType>(NetworkedSchema)

export function setup_entity(three_object: Object3D, world: IWorld)
{
    const ent = addEntity(world);

    addComponent(world, TransformComponent, ent);

    addComponent(world, NetworkedComponent, ent);


    three_object.userData.narval = {
        eid: ent,
    }

    // position
    Object.defineProperty(three_object.position, 'eid', { get: () => ent })
    Object.defineProperty(three_object.position, 'store', { get: () => TransformComponent.position })

    Object.defineProperty(three_object.position, 'x', {
        get() { return this.store.x[this.eid] },
        set(n) { this.store.x[this.eid] = n }
    })
    Object.defineProperty(three_object.position, 'y', {
        get() { return this.store.y[this.eid] },
        set(n) { this.store.y[this.eid] = n }
    })
    Object.defineProperty(three_object.position, 'z', {
        get() { return this.store.z[this.eid] },
        set(n) { this.store.z[this.eid] = n }
    })

    // rotation
    Object.defineProperty(three_object.rotation, 'eid', { get: () => ent })
    Object.defineProperty(three_object.rotation, 'store', { get: () => TransformComponent.rotation })

    Object.defineProperty(three_object.rotation, '_x', {
        get() { return this.store.x[this.eid] },
        set(n) { this.store.x[this.eid] = n }
    })
    Object.defineProperty(three_object.rotation, '_y', {
        get() { return this.store.y[this.eid] },
        set(n) { this.store.y[this.eid] = n }
    })
    Object.defineProperty(three_object.rotation, '_z', {
        get() { return this.store.z[this.eid] },
        set(n) { this.store.z[this.eid] = n }
    })

    // scale
    Object.defineProperty(three_object.scale, 'eid', { get: () => ent })
    Object.defineProperty(three_object.scale, 'store', { get: () => TransformComponent.scale })

    Object.defineProperty(three_object.scale, 'x', {
        get() { return this.store.x[this.eid] },
        set(n) { this.store.x[this.eid] = n }
    })
    Object.defineProperty(three_object.scale, 'y', {
        get() { return this.store.y[this.eid] },
        set(n) { this.store.y[this.eid] = n }
    })
    Object.defineProperty(three_object.scale, 'z', {
        get() { return this.store.z[this.eid] },
        set(n) { this.store.z[this.eid] = n }
    })

    return ent;
}