import { assert } from "chai";
import { mount } from "@vue/test-utils";
import ImageUpload from "../src/components/ImageUpload";
import sinon from "sinon";
import sinonStubPromise from "sinon-stub-promise";
import moxios from "moxios";

sinonStubPromise(sinon);

describe("The image preview of the upload component", () => {
  let component;

  beforeEach(() => {
    component = mount(ImageUpload, {
      propsData: {
        uploadUrl: "/test/upload/url"
      }
    });
    component.setMethods({
      getPreview: sinon
        .stub()
        .returnsPromise()
        .resolves(null)
    });
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });

  it("has an img tag for the preview", () => {
    assert.isTrue(component.contains("img.preview"));
  });

  it("can accept an initial src for the preview image", done => {
    let uploader = mount(ImageUpload, {
      propsData: {
        uploadUrl: "/test/upload/url",
        initialSrc: "/test/image.jpg"
      }
    });

    //simulate next tick
    setTimeout(() => {
      assert.isTrue(uploader.contains("img[src='/test/image.jpg']"));
      done();
    }, 10);
  });

  it("sets the preview to be src returned from server after upload", done => {
    moxios.stubRequest("/test/upload/url", {
      status: 200,
      response: {
        image_src: "/test/image.jpg"
      }
    });

    selectFile({ size: 1000, type: "image/jpg" });

    moxios.wait(() => {
      assert.isTrue(component.contains('img[src="/test/image.jpg"]'));
      done();
    });
  });

  it("sets the preview image to the src returned by the getPreview method", () => {
    let getPreviewStub = sinon
      .stub()
      .returnsPromise()
      .resolves("/dummy/preview.svg");
    component.setMethods({ getPreview: getPreviewStub });
    selectFile({ size: 1000, type: "image/jpg" });

    assert.isTrue(component.contains('img[src="/dummy/preview.svg"]'));
  });

  it("clears the preview of a unsuccessful upload", done => {
    moxios.stubRequest("/test/upload/url", {
      status: 500
    });
    let getPreviewStub = sinon
      .stub()
      .returnsPromise()
      .resolves("/dummy/preview.svg");
    component.setMethods({ getPreview: getPreviewStub });
    selectFile({ size: 1000, type: "image/jpg" });

    assert.equal("/dummy/preview.svg", component.vm.preview_src);

    moxios.wait(() => {
      assert.notExists(component.vm.current_preview);
      done();
    });
  });

  it("considers a provided initial src to be server confirmed", () => {
    let uploader = mount(ImageUpload, {
      propsData: {
        uploadUrl: "/test/upload/url",
        initialSrc: "/image_test.jpg"
      }
    });

    assert.equal("/image_test.jpg", uploader.vm.last_server_src);
  });

  it("calculates the default preview dimensions", () => {
    const preview_dimensions = component.vm.previewDimensions();
    assert.deepEqual({ pWidth: 300, pHeight: 200 }, preview_dimensions);
  });

  it("will keep the original aspect ratio if aspect x or aspect y is auto", () => {
    component.setProps({
      previewWidth: 750,
      aspectX: "auto",
      aspectY: 2
    });
    const preview_dimensions = component.vm.previewDimensions();
    assert.deepEqual({ pWidth: "auto", pHeight: "auto" }, preview_dimensions);
  });

  it("calculates the correct preview dimensions when user gives review width", () => {
    component.setProps({
      previewWidth: 750,
      aspectX: 1,
      aspectY: 2
    });
    const preview_dimensions = component.vm.previewDimensions();
    assert.deepEqual({ pWidth: 750, pHeight: 1500 }, preview_dimensions);
  });

  function selectFile(file_data) {
    let takeFileStub = sinon.stub().returns(file_data);
    component.setMethods({ takeFile: takeFileStub });

    let file_input = component.find("input[type=file]");
    file_input.trigger("change");
  }
});
