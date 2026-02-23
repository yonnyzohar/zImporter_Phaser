export class ParticleConverter {
    /**
     * Converts PIXI particles v5 configuration to Phaser 3 particle configuration
     */
    static pixiToPhaserConfig(pixiConfig) {
        const phaserConfig = {};
        // Particle lifetime: PIXI uses seconds, Phaser uses milliseconds
        if (pixiConfig.lifetime) {
            if (pixiConfig.lifetime.min !== undefined && pixiConfig.lifetime.max !== undefined) {
                phaserConfig.lifespan = {
                    min: pixiConfig.lifetime.min * 1000,
                    max: pixiConfig.lifetime.max * 1000
                };
            }
            else {
                phaserConfig.lifespan = (pixiConfig.lifetime.min || pixiConfig.lifetime.max || pixiConfig.lifetime) * 1000;
            }
        }
        else {
            phaserConfig.lifespan = 1000;
        }
        // Emission frequency: PIXI uses seconds between emissions, Phaser uses milliseconds  
        // BUT: PIXI frequency might be per-particle, not per-wave
        if (pixiConfig.frequency !== undefined) {
            let frequency = pixiConfig.frequency * 1000; // Convert to milliseconds
            // Check if we have spawnBurst behavior - this affects how frequency works
            const spawnBurstBehavior = pixiConfig.behaviors?.find((b) => b.type === 'spawnBurst');
            if (spawnBurstBehavior && spawnBurstBehavior.config.particlesPerWave > 1) {
                // If burst spawns multiple particles, frequency might be per burst, not per particle
                // Keep the frequency as-is, but we'll adjust quantity in spawnBurst processing
                frequency = pixiConfig.frequency * 1000;
                console.log(`Burst emission: ${frequency}ms between bursts of ${spawnBurstBehavior.config.particlesPerWave} particles`);
            }
            else {
                // Individual particle emission
                frequency = pixiConfig.frequency * 1000;
            }
            phaserConfig.frequency = frequency;
        }
        else {
            phaserConfig.frequency = 100;
        }
        // Max particles - for infinite emission, we need enough particles to sustain the emission rate
        if (pixiConfig.maxParticles) {
            // For infinite emission with high frequency, increase maxParticles significantly
            if (pixiConfig.emitterLifetime === -1) {
                // Calculate needed particles: (particles per emission) * (emissions per lifetime)
                // With 40 particles every 10ms and 1.25s lifetime = need ~5000 particles
                phaserConfig.maxParticles = Math.max(pixiConfig.maxParticles, 5000);
                console.log(`Increased maxParticles to ${phaserConfig.maxParticles} for infinite emission`);
            }
            else {
                phaserConfig.maxParticles = pixiConfig.maxParticles;
            }
        }
        else {
            phaserConfig.maxParticles = 5000; // Default high value for infinite emission
        }
        // Handle emitterLifetime explicitly
        if (pixiConfig.emitterLifetime === -1) {
            // Infinite emission - ensure no stopping conditions
            console.log("Setting up infinite emission (emitterLifetime: -1)");
            // Don't set stopAfter - let it run forever
        }
        else if (pixiConfig.emitterLifetime > 0) {
            // Finite emission duration  
            phaserConfig.stopAfter = pixiConfig.emitterLifetime * 1000;
            console.log(`Finite emission: ${pixiConfig.emitterLifetime} seconds`);
        }
        // Default quantity (will be overridden by spawnBurst)
        phaserConfig.quantity = 1;
        // Process behaviors
        if (pixiConfig.behaviors && Array.isArray(pixiConfig.behaviors)) {
            for (const behavior of pixiConfig.behaviors) {
                this.processBehavior(behavior, phaserConfig);
            }
        }
        console.log("PIXI to Phaser conversion:");
        console.log("Original PIXI config:", pixiConfig);
        console.log("Converted Phaser config:", phaserConfig);
        return phaserConfig;
    }
    static processBehavior(behavior, phaserConfig) {
        switch (behavior.type) {
            case 'alpha':
                this.processAlphaBehavior(behavior.config, phaserConfig);
                break;
            case 'scale':
                this.processScaleBehavior(behavior.config, phaserConfig);
                break;
            case 'color':
                this.processColorBehavior(behavior.config, phaserConfig);
                break;
            case 'moveSpeed':
                this.processMoveSpeedBehavior(behavior.config, phaserConfig);
                break;
            case 'rotationStatic':
                this.processRotationStaticBehavior(behavior.config, phaserConfig);
                break;
            case 'spawnBurst':
                this.processSpawnBurstBehavior(behavior.config, phaserConfig);
                break;
            case 'textureSingle':
                // Texture handled separately
                break;
            default:
                console.warn('Unknown PIXI particle behavior:', behavior.type);
        }
    }
    static processAlphaBehavior(config, phaserConfig) {
        if (config.alpha?.list && config.alpha.list.length >= 2) {
            const list = config.alpha.list;
            const start = list.find((item) => item.time === 0) || list[0];
            const end = list.find((item) => item.time === 1) || list[list.length - 1];
            phaserConfig.alpha = {
                start: start.value,
                end: end.value
            };
        }
    }
    static processScaleBehavior(config, phaserConfig) {
        if (config.scale?.list && config.scale.list.length >= 2) {
            const list = config.scale.list;
            const start = list.find((item) => item.time === 0) || list[0];
            const end = list.find((item) => item.time === 1) || list[list.length - 1];
            phaserConfig.scale = {
                start: start.value,
                end: end.value
            };
        }
    }
    static processColorBehavior(config, phaserConfig) {
        if (config.color?.list && config.color.list.length >= 2) {
            const list = config.color.list;
            const start = list.find((item) => item.time === 0) || list[0];
            const end = list.find((item) => item.time === 1) || list[list.length - 1];
            phaserConfig.tint = {
                start: this.hexToInt(start.value),
                end: this.hexToInt(end.value)
            };
        }
    }
    static processMoveSpeedBehavior(config, phaserConfig) {
        if (config.speed?.list && config.speed.list.length >= 2) {
            const list = config.speed.list;
            const start = list.find((item) => item.time === 0) || list[0];
            const end = list.find((item) => item.time === 1) || list[list.length - 1];
            const startSpeed = start.value;
            const endSpeed = end.value;
            // Use speed range - particles will have random speed in this range
            phaserConfig.speed = {
                min: Math.min(startSpeed, endSpeed),
                max: Math.max(startSpeed, endSpeed)
            };
            // Add drag to simulate speed decay (NOT directional acceleration)
            if (startSpeed > endSpeed) {
                // Calculate drag needed to reduce speed over particle lifetime
                const avgLifetime = 1.25; // 1-1.5 second average
                const speedReduction = startSpeed - endSpeed;
                const dragNeeded = speedReduction / (avgLifetime * 60); // 60 FPS
                phaserConfig.drag = dragNeeded;
            }
        }
    }
    static processRotationStaticBehavior(config, phaserConfig) {
        if (config.min !== undefined && config.max !== undefined) {
            phaserConfig.rotate = {
                min: config.min * (Math.PI / 180),
                max: config.max * (Math.PI / 180)
            };
        }
    }
    static processSpawnBurstBehavior(config, phaserConfig) {
        if (config.particlesPerWave) {
            // PIXI particlesPerWave might spawn all at once per frequency interval
            // But this could be too many - let's reduce it for visual match
            const particlesPerWave = config.particlesPerWave;
            // Reduce quantity to match PIXI visual density better
            phaserConfig.quantity = Math.max(1, Math.floor(particlesPerWave / 4));
            console.log(`Adjusted quantity from ${particlesPerWave} to ${phaserConfig.quantity} for visual match`);
        }
        if (config.angle) {
            phaserConfig.angle = {
                min: config.angle.min,
                max: config.angle.max
            };
        }
    }
    static hexToInt(hex) {
        const cleanHex = hex.replace('#', '');
        return parseInt(cleanHex, 16);
    }
}
//# sourceMappingURL=ParticleConverter.js.map