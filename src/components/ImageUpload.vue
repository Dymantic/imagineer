<template>
  <div class="dd-image-uploader">
    <div class="upload-track" v-show="uploading">
      <div class="upload-bar" :style="upload_style"></div>
    </div>
    <div class="aspect-box" :style="background_style">
      <svg :viewBox="aspect_string"></svg>
      <div>
        <input type="file" :id="input_id" @change="handleFile($event)">
        <label :for="input_id">
          <img :src="preview_src" alt="" class="preview">       
        </label>
      </div>
    </div>
    <button v-show="deleteUrl && last_server_src" class="delete-btn" @click="deleteImage">Clear image</button>
  </div>
</template>

<script>
import axios from "axios";
import default_image_src from "../assets/default_image";
import { generatePreview } from "../../lib/PreviewGenerator";

export default {
  props: {
    "upload-url": {
      type: String,
      required: true
    },

    unique: {
      type: String,
      default: ""
    },

    "max-size": {
      type: Number,
      default: 100
    },
    "initial-src": {
      type: String,
      default: ""
    },
    "delete-url": {
      type: String,
      default: ""
    },
    "preview-width": {
      type: Number,
      default: 300
    },
    "aspect-x": {
      type: [Number, String],
      default: 3
    },
    "aspect-y": {
      type: [Number, String],
      default: 2
    }
  },

  data() {
    return {
      last_server_src: null,
      current_preview: null,
      default_src: default_image_src,
      upload_progress: 0,
      uploading: false
    };
  },

  computed: {
    input_id() {
      return this.unique
        ? `dd-image-upload-input_${this.unique}`
        : `dd-image-upload-input`;
    },

    max_file_size() {
      return this.maxSize * 1024 * 1000;
    },

    preview_src() {
      if (this.current_preview) {
        return this.current_preview;
      }
      if (!this.last_server_src) {
        return this.default_src;
      }

      return this.last_server_src;
    },

    aspect_string() {
      if (this.aspectX === "auto" || this.aspectY === "auto") {
        return `0 0 100 100`;
      }
      return `0 0 ${this.aspectX} ${this.aspectY}`;
    },

    upload_style() {
      const translate_amount = 100 - this.upload_progress;
      return { transform: `translate3d(-${translate_amount}%,0,0)` };
    },

    background_style() {
      const colour =
        this.last_server_src || this.current_preview
          ? "transparent"
          : "#c4c4c4";
      return { background: colour };
    }
  },

  mounted() {
    if (this.initialSrc) {
      this.last_server_src = this.initialSrc;
    }
  },

  methods: {
    takeFile(ev) {
      return ev.target.files[0];
    },

    handleFile(ev) {
      let file = this.takeFile(ev);

      if (!this.validateFile(file)) {
        return;
      }

      this.getPreview(file).then(src => (this.current_preview = src));

      this.uploadFile(file);
    },

    getPreview(file) {
      return generatePreview(file, this.previewDimensions());
    },

    previewDimensions() {
      if (this.aspectX === "auto" || this.aspectY === "auto") {
        return {
          pWidth: "auto",
          pHeight: "auto"
        };
      }
      return {
        pWidth: this.previewWidth,
        pHeight: this.previewWidth * (this.aspectY / this.aspectX)
      };
    },

    validateFile(file) {
      if (file.type.indexOf("image") !== 0) {
        this.emitInvalidFileEvent(
          "the file you selected is not an accepted image type"
        );
        return false;
      }

      if (file.size > this.max_file_size) {
        this.emitInvalidFileEvent(
          `your image is too big. Try an image under ${this.maxSize}MB`
        );
        return false;
      }

      return true;
    },

    emitInvalidFileEvent(message) {
      this.$emit("invalid-file-selected", message);
    },

    uploadFile(file) {
      let image = new FormData();
      this.uploading = true;
      image.append("image", file);
      axios
        .post(this.uploadUrl, image, {
          onUploadProgress: ev =>
            (this.upload_progress = parseInt(ev.loaded / ev.total * 100))
        })
        .then(({ data }) => this.onUploadSuccess(data))
        .catch(err => this.onUploadFailure(err))
        .then(() => {
          this.uploading = false;
          this.upload_progress = 0;
        });
    },

    onUploadSuccess(response_data) {
      this.last_server_src = response_data.image_src;
      this.current_preview = null;
      this.$emit("image-uploaded", response_data);
    },

    onUploadFailure(err) {
      this.current_preview = null;
      const response = err.response;

      if (!response) {
        this.$emit(
          "image-upload-error",
          "There was an error uploading the image"
        );

        return;
      }
      if (response.status === 422) {
        this.$emit(
          "image-failed-validation",
          err.response.data.errors.image[0]
        );

        return;
      }
      this.$emit(
        "image-upload-failed",
        `The upload failed with a status code of ${err.response.status}`
      );
    },

    deleteImage() {
      if (!this.deleteUrl) {
        return;
      }

      axios
        .delete(this.deleteUrl)
        .then(this.onDeleteSuccess)
        .catch(this.onDeletionFailure);
    },

    onDeleteSuccess() {
      this.$emit("image-deleted");
      this.last_server_src = null;
    },

    onDeletionFailure() {
      this.$emit("deletion-failed");
    }
  }
};
</script>

<style lang="scss" type="text/css">
.dd-image-uploader {
  position: relative;

  input[type="file"] {
    display: none;
  }

  label {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    align-items: center;

    img {
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
    }
  }

  .aspect-box {
    display: grid;

    & > * {
      grid-area: 1 / 1 / 2 / 2;
    }

    & > div {
      position: relative;
    }

    label {
      overflow: hidden;
    }
  }

  .upload-track {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 10px;
    background: transparent;
    overflow: hidden;
    z-index: 99999;

    .upload-bar {
      width: 100%;
      height: 10px;
      background: #1f9d55;
      transform: translate3d(-100%, 0, 0);
    }
  }

  .delete-btn {
    font-size: 0.75rem;
    color: darkred;
    border: none;
    background: transparent;
    text-decoration: underline;
  }
}
</style>
