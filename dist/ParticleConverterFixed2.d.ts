export declare class ParticleConverter {
    /**
     * Converts PIXI particles v5 configuration to Phaser 3 particle configuration
     * Based on official PIXI particles v5 documentation and examples
     */
    static pixiToPhaserConfig(pixiConfig: any): any;
    private static processBehavior;
    private static processAlphaBehavior;
    private static processScaleBehavior;
    private static processColorBehavior;
    private static processMoveSpeedBehavior;
    private static processRotationStaticBehavior;
    private static processSpawnBurstBehavior;
    /**
     * Convert hex color string to integer (with or without #)
     */
    static hexToInt(hex: string): number;
}
//# sourceMappingURL=ParticleConverterFixed2.d.ts.map