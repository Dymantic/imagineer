import { assert } from "chai";
import { mount } from "@vue/test-utils";
import ImageUpload from "../src/components/ImageUpload";
import sinon from "sinon";
import moxios from "moxios";
import sinonStubPromise from "sinon-stub-promise";
sinonStubPromise(sinon);

describe("A single image upload component", () => {
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

  it("has a file input", () => {
    assert.isTrue(component.contains("input[type=file]"));
  });

  it("has a label for the file input with a matching for attribute", () => {
    let file_input = component.find("input[type=file]");
    assert.isTrue(component.contains(`label[for=${file_input.element.id}]`));
  });

  it("can be given a unique id to use for input and label", () => {
    component.setProps({ unique: "foo" });
    let file_input = component.find("input[type=file]");
    assert.equal("dd-image-upload-input_foo", file_input.element.id);
    assert.isTrue(component.contains(`label[for=${file_input.element.id}]`));
  });

  it("will attempt to upload a valid file", done => {
    selectFile({ size: 1000, type: "image/png" });

    moxios.wait(() => {
      let request = moxios.requests.mostRecent();
      assert.equal("/test/upload/url", request.config.url);
      assert.equal("post", request.config.method);
      assert.instanceOf(request.config.data, FormData);
      assert.exists(request.config.data.get("image"));
      done();
    });
  });

  it("the uploading flag is initially false", () => {
    assert.isFalse(component.vm.uploading);
  });

  it("sets uploading to true whilst uploading", done => {
    selectFile({ size: 1000, type: "image/png" });

    assert.isTrue(component.vm.uploading);

    done();
  });

  it("resets the uploading progress and flag after a okay response", done => {
    moxios.stubRequest("/test/upload/url", { status: 200 });
    selectFile({ size: 1000, type: "image/png" });

    moxios.wait(() => {
      assert.equal(0, component.vm.upload_progress);
      assert.isFalse(component.vm.uploading);
      done();
    });
  });

  it("resets the uploading progress and flag after a fail response", done => {
    moxios.stubRequest("/test/upload/url", { status: 500 });
    selectFile({ size: 1000, type: "image/png" });

    moxios.wait(() => {
      assert.equal(0, component.vm.upload_progress);
      assert.isFalse(component.vm.uploading);
      done();
    });
  });

  it("will not show delete button if has no last server src", () => {
    component.setProps({ deleteUrl: "/test/delete/url" });
    component.setData({ last_server_src: null });
    const delete_btn = component.find(".delete-btn");
    assert.equal("none", delete_btn.element.style.display);
  });

  function selectFile(file_data) {
    let takeFileStub = sinon.stub().returns(file_data);
    component.setMethods({ takeFile: takeFileStub });

    let file_input = component.find("input[type=file]");
    file_input.trigger("change");
  }
});
