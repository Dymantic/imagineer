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

  function selectFile(file_data) {
    let takeFileStub = sinon.stub().returns(file_data);
    component.setMethods({ takeFile: takeFileStub });

    let file_input = component.find("input[type=file]");
    file_input.trigger("change");
  }
});
