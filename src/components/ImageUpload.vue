<template>
  <div class="dd-image-uploader">
      <input type="file" :id="input_id" @change="handleFile($event)">
      <label :for="input_id">
        <img :src="preview_src" alt="" class="preview">       
      </label>
      <button v-show="deleteUrl" class="delete-btn" @click="deleteImage">CLear image</button>
  </div>
</template>

<script>
import axios from "axios";
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
    "aspect-x": {
      type: Number,
      default: 300
    },
    "aspect-y": {
      type: Number,
      default: 300
    }
  },

  data() {
    return {
      last_server_src: null,
      current_preview: null,
      default_src: "/default/image.jpg"
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
      return generatePreview(file, {
        pWidth: this.aspectX,
        pHeight: this.aspectY
      });
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
      image.append("image", file);
      axios
        .post(this.uploadUrl, image)
        .then(({ data }) => this.onUploadSuccess(data))
        .catch(err => this.onUploadFailure(err));
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

  label {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;

    img {
      width: 100%;
    }
  }
}
</style>
