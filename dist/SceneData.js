export var AnchorConsts;
(function (AnchorConsts) {
    AnchorConsts["NONE"] = "none";
    AnchorConsts["TOP_LEFT"] = "topLeft";
    AnchorConsts["TOP_RIGHT"] = "topRight";
    AnchorConsts["BOTTOM_LEFT"] = "btmLeft";
    AnchorConsts["BOTTOM_RIGHT"] = "btmRight";
    AnchorConsts["LEFT"] = "left";
    AnchorConsts["RIGHT"] = "right";
    AnchorConsts["TOP"] = "top";
    AnchorConsts["BOTTOM"] = "btm";
    AnchorConsts["CENTER"] = "center";
})(AnchorConsts || (AnchorConsts = {}));
;
;
export class BitmapTextGradientData {
    colors = [];
    percentages = [];
    fillGradientType = "vertical"; // Phaser does not have PIXI.TEXT_GRADIENT, so use string
}
//# sourceMappingURL=SceneData.js.map