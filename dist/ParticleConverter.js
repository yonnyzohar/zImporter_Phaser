export class ParticleConverter {
    /**
     * Converts PIXI particles v5 configuration to Phaser 3 particle configuration
     */
    static pixiToPhaserConfig(pixiConfig) {
        const phaserConfig = {
            // Basic properties
            lifespan: this.extractLifetime(pixiConfig),
            frequency: this.extractFrequency(pixiConfig),
            maxParticles: pixiConfig.maxParticles || 100
        };
        // Process behaviors
        if (pixiConfig.behaviors && Array.isArray(pixiConfig.behaviors)) {
            for (const behavior of pixiConfig.behaviors) {
                this.processBehavior(behavior, phaserConfig);
            }
        }
        return phaserConfig;
    }
    static extractLifetime(pixiConfig) {
        const lifetime = pixiConfig.lifetime;
        if (lifetime) {
            if (lifetime.min !== undefined && lifetime.max !== undefined) {
                return { min: lifetime.min * 1000, max: lifetime.max * 1000 }; // Convert to ms
            }
            return (lifetime.min || lifetime.max || lifetime) * 1000;
        }
        return 1000; // Default 1 second
    }
    static extractFrequency(pixiConfig) {
        if (pixiConfig.frequency) {
            // PIXI frequency is particles per second, Phaser wants interval in ms
            return 1000 / (1 / pixiConfig.frequency);
        }
        return 100; // Default 100ms interval
    }
    static processBehavior(behavior, phaserConfig) {
        switch (behavior.type) {
            case 'alpha':
                this.processAlpha(behavior.config, phaserConfig);
                break;
            case 'scale':
                this.processScale(behavior.config, phaserConfig);
                break;
            case 'color':
                this.processColor(behavior.config, phaserConfig);
                break;
            case 'moveSpeed':
                this.processMoveSpeed(behavior.config, phaserConfig);
                break;
            case 'rotationStatic':
                this.processRotationStatic(behavior.config, phaserConfig);
                break;
            case 'spawnBurst':
                this.processSpawnBurst(behavior.config, phaserConfig);
                break;
            case 'textureSingle':
                // Texture is handled separately in ZScene
                break;
            default:
                console.warn('Unknown PIXI particle behavior:', behavior.type);
        }
    }
    static processAlpha(config, phaserConfig) {
        if (config.alpha?.list) {
            const alphaList = config.alpha.list;
            if (alphaList.length >= 2) {
                phaserConfig.alpha = {
                    start: alphaList[0].value,
                    end: alphaList[alphaList.length - 1].value
                };
            }
        }
    }
    static processScale(config, phaserConfig) {
        if (config.scale?.list) {
            const scaleList = config.scale.list;
            if (scaleList.length >= 2) {
                phaserConfig.scale = {
                    start: scaleList[0].value,
                    end: scaleList[scaleList.length - 1].value
                };
            }
        }
    }
    static processColor(config, phaserConfig) {
        if (config.color?.list) {
            const colorList = config.color.list;
            if (colorList.length >= 1) {
                // Phaser uses tint for color changes
                phaserConfig.tint = colorList.map((c) => c.value);
            }
        }
    }
    static processMoveSpeed(config, phaserConfig) {
        if (config.speed?.list) {
            const speedList = config.speed.list;
            if (speedList.length >= 2) {
                phaserConfig.speed = {
                    min: speedList[speedList.length - 1].value,
                    max: speedList[0].value
                };
            }
            else if (speedList.length === 1) {
                phaserConfig.speed = speedList[0].value;
            }
        }
    }
    static processRotationStatic(config, phaserConfig) {
        if (config.min !== undefined && config.max !== undefined) {
            phaserConfig.rotate = {
                min: Phaser.Math.DegToRad(config.min),
                max: Phaser.Math.DegToRad(config.max)
            };
        }
    }
    static processSpawnBurst(config, phaserConfig) {
        if (config.particlesPerWave) {
            phaserConfig.quantity = config.particlesPerWave;
        }
        if (config.angle) {
            phaserConfig.angle = {
                min: config.angle.min,
                max: config.angle.max
            };
        }
        if (config.radius !== undefined) {
            phaserConfig.radial = config.radius > 0;
        }
    }
    /**
     * Helper method to convert hex color strings to Phaser color integers
     */
    static hexToInt(hex) {
        return parseInt(hex.replace('#', ''), 16);
    }
}
//# sourceMappingURL=ParticleConverter.js.map