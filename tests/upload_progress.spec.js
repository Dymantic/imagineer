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

  it("has an upload progress bar", () => {
    assert.isTrue(component.contains(".upload-track"));
    assert.isTrue(component.contains(".upload-bar"));
  });

  it("sets the transform style based of upload progress", () => {
    component.setData({ upload_progress: 50 });

    const style_object = component.vm.upload_style;
    assert.deepEqual({ transform: "translate3d(-50%,0,0)" }, style_object);
  });

  it("hides the upload track when not uploading", () => {
    component.setData({ uploading: false });
    const track = component.find(".upload-track");
    assert.equal("none", track.element.style.display);
  });

  it("shows the upload track when uploading", () => {
    selectFile({ size: 1000, type: "image/png" });

    const track = component.find(".upload-track");
    assert.notEqual("none", track.element.style.display);
  });

  function selectFile(file_data) {
    let takeFileStub = sinon.stub().returns(file_data);
    component.setMethods({ takeFile: takeFileStub });

    let file_input = component.find("input[type=file]");
    file_input.trigger("change");
  }
});
